import Pusher from "pusher-js"
import { supabaseAdmin } from "./database"

export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "join-room" | "leave-room" | "user-joined" | "user-left"
  roomId: string
  userId: string
  data?: any
}

export class SignalingClient {
  private pusher: Pusher
  private channel: any
  private currentRoomId: string | null = null
  private messageHandlers: Map<string, (message: SignalingMessage) => void> = new Map()

  constructor(
    private tenantId: string,
    private userId: string,
  ) {
    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-id": userId,
        },
      },
    })
  }

  async joinRoom(roomId: string) {
    if (this.currentRoomId) {
      await this.leaveRoom()
    }

    this.currentRoomId = roomId
    this.channel = this.pusher.subscribe(`private-room-${this.tenantId}-${roomId}`)

    // Set up event listeners
    this.channel.bind("webrtc-signal", (message: SignalingMessage) => {
      const handler = this.messageHandlers.get(message.type)
      if (handler && message.userId !== this.userId) {
        handler(message)
      }
    })

    this.channel.bind("user-joined", (data: { userId: string; userInfo: any }) => {
      const handler = this.messageHandlers.get("user-joined")
      if (handler && data.userId !== this.userId) {
        handler({
          type: "user-joined",
          roomId,
          userId: data.userId,
          data: data.userInfo,
        })
      }
    })

    this.channel.bind("user-left", (data: { userId: string }) => {
      const handler = this.messageHandlers.get("user-left")
      if (handler) {
        handler({
          type: "user-left",
          roomId,
          userId: data.userId,
        })
      }
    })

    // Notify others that user joined
    await this.sendMessage({
      type: "join-room",
      roomId,
      userId: this.userId,
    })

    // Store room participation
    await supabaseAdmin.from("video_room_participants").upsert({
      tenant_id: this.tenantId,
      room_id: roomId,
      user_id: this.userId,
      joined_at: new Date().toISOString(),
    })
  }

  async leaveRoom() {
    if (this.currentRoomId && this.channel) {
      await this.sendMessage({
        type: "leave-room",
        roomId: this.currentRoomId,
        userId: this.userId,
      })

      this.pusher.unsubscribe(`private-room-${this.tenantId}-${this.currentRoomId}`)

      // Update room participation
      await supabaseAdmin
        .from("video_room_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("tenant_id", this.tenantId)
        .eq("room_id", this.currentRoomId)
        .eq("user_id", this.userId)
        .is("left_at", null)

      this.currentRoomId = null
      this.channel = null
    }
  }

  async sendMessage(message: SignalingMessage) {
    if (!this.channel) return

    try {
      await fetch("/api/pusher/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": this.tenantId,
        },
        body: JSON.stringify({
          channel: `private-room-${this.tenantId}-${message.roomId}`,
          event: "webrtc-signal",
          data: message,
        }),
      })
    } catch (error) {
      console.error("Error sending signaling message:", error)
    }
  }

  onMessage(type: string, handler: (message: SignalingMessage) => void) {
    this.messageHandlers.set(type, handler)
  }

  disconnect() {
    if (this.currentRoomId) {
      this.leaveRoom()
    }
    this.pusher.disconnect()
  }
}
