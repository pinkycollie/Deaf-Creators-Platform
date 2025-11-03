"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  RepeatIcon as Record,
  StopCircle,
} from "lucide-react"
import { WebRTCConnection } from "@/lib/webrtc"
import { SignalingClient } from "@/lib/signaling"

interface VideoCallInterfaceProps {
  roomId: string
  tenantId: string
  userId: string
  userName: string
  onLeave?: () => void
}

interface Participant {
  id: string
  name: string
  stream?: MediaStream
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
}

export function VideoCallInterface({ roomId, tenantId, userId, userName, onLeave }: VideoCallInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map())
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; user: string; message: string; timestamp: Date }>
  >([])
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const webrtcConnections = useRef<Map<string, WebRTCConnection>>(new Map())
  const signalingClient = useRef<SignalingClient | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])

  const { toast } = useToast()

  useEffect(() => {
    initializeVideoCall()
    return () => {
      cleanup()
    }
  }, [roomId, tenantId, userId])

  const initializeVideoCall = async () => {
    try {
      // Initialize signaling client
      signalingClient.current = new SignalingClient(tenantId, userId)

      // Set up signaling event handlers
      signalingClient.current.onMessage("user-joined", handleUserJoined)
      signalingClient.current.onMessage("user-left", handleUserLeft)
      signalingClient.current.onMessage("offer", handleOffer)
      signalingClient.current.onMessage("answer", handleAnswer)
      signalingClient.current.onMessage("ice-candidate", handleIceCandidate)

      // Join the room
      await signalingClient.current.joinRoom(roomId)

      // Initialize local media
      await initializeLocalMedia()

      setIsConnected(true)
      toast({
        title: "Connected",
        description: "Successfully joined the video call",
      })
    } catch (error) {
      console.error("Error initializing video call:", error)
      toast({
        title: "Connection Error",
        description: "Failed to join the video call",
        variant: "destructive",
      })
    }
  }

  const initializeLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStream.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Update local participant
      setParticipants((prev) => {
        const updated = new Map(prev)
        updated.set(userId, {
          id: userId,
          name: userName,
          stream,
          isVideoEnabled,
          isAudioEnabled,
          isScreenSharing: false,
        })
        return updated
      })
    } catch (error) {
      console.error("Error accessing media devices:", error)
      toast({
        title: "Media Error",
        description: "Could not access camera or microphone",
        variant: "destructive",
      })
    }
  }

  const handleUserJoined = useCallback(
    async (message: any) => {
      const { userId: remoteUserId, data: userInfo } = message

      // Create WebRTC connection for new user
      const connection = new WebRTCConnection()
      webrtcConnections.current.set(remoteUserId, connection)

      // Add local stream to connection
      if (localStream.current) {
        await connection.initializeLocalStream()
      }

      // Handle remote stream
      connection.onRemoteStream((stream) => {
        setParticipants((prev) => {
          const updated = new Map(prev)
          const participant = updated.get(remoteUserId) || {
            id: remoteUserId,
            name: userInfo.name,
            isVideoEnabled: true,
            isAudioEnabled: true,
            isScreenSharing: false,
          }
          participant.stream = stream
          updated.set(remoteUserId, participant)
          return updated
        })
      })

      // Handle data channel messages
      connection.onDataChannelMessage((message) => {
        if (message.type === "chat") {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              user: userInfo.name,
              message: message.text,
              timestamp: new Date(),
            },
          ])
        }
      })

      // Create and send offer
      const offer = await connection.createOffer()
      await signalingClient.current?.sendMessage({
        type: "offer",
        roomId,
        userId,
        data: offer,
      })
    },
    [roomId, userId],
  )

  const handleUserLeft = useCallback((message: any) => {
    const { userId: remoteUserId } = message

    // Clean up WebRTC connection
    const connection = webrtcConnections.current.get(remoteUserId)
    if (connection) {
      connection.disconnect()
      webrtcConnections.current.delete(remoteUserId)
    }

    // Remove participant
    setParticipants((prev) => {
      const updated = new Map(prev)
      updated.delete(remoteUserId)
      return updated
    })
  }, [])

  const handleOffer = useCallback(
    async (message: any) => {
      const { userId: remoteUserId, data: offer } = message

      const connection = webrtcConnections.current.get(remoteUserId)
      if (connection) {
        const answer = await connection.createAnswer(offer)
        await signalingClient.current?.sendMessage({
          type: "answer",
          roomId,
          userId,
          data: answer,
        })
      }
    },
    [roomId, userId],
  )

  const handleAnswer = useCallback(async (message: any) => {
    const { userId: remoteUserId, data: answer } = message

    const connection = webrtcConnections.current.get(remoteUserId)
    if (connection) {
      await connection.handleAnswer(answer)
    }
  }, [])

  const handleIceCandidate = useCallback(async (message: any) => {
    const { userId: remoteUserId, data: candidate } = message

    const connection = webrtcConnections.current.get(remoteUserId)
    if (connection) {
      await connection.handleIceCandidate(candidate)
    }
  }, [])

  const toggleVideo = async () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)

        // Notify other participants
        webrtcConnections.current.forEach((connection) => {
          connection.sendDataChannelMessage({
            type: "media-state",
            video: videoTrack.enabled,
            audio: isAudioEnabled,
          })
        })
      }
    }
  }

  const toggleAudio = async () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)

        // Notify other participants
        webrtcConnections.current.forEach((connection) => {
          connection.sendDataChannelMessage({
            type: "media-state",
            video: isVideoEnabled,
            audio: audioTrack.enabled,
          })
        })
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: true,
        })

        // Replace video track in all connections
        const videoTrack = screenStream.getVideoTracks()[0]
        webrtcConnections.current.forEach(async (connection) => {
          await connection.startScreenShare()
        })

        setIsScreenSharing(true)

        // Handle screen share end
        videoTrack.onended = () => {
          stopScreenShare()
        }
      } else {
        stopScreenShare()
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
      toast({
        title: "Screen Share Error",
        description: "Could not start screen sharing",
        variant: "destructive",
      })
    }
  }

  const stopScreenShare = async () => {
    webrtcConnections.current.forEach(async (connection) => {
      await connection.stopScreenShare()
    })
    setIsScreenSharing(false)
  }

  const startRecording = async () => {
    try {
      if (!localStream.current) return

      const options = {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 2500000,
      }

      mediaRecorder.current = new MediaRecorder(localStream.current, options)
      recordedChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" })
        await uploadRecording(blob)
      }

      mediaRecorder.current.start(1000) // Collect data every second
      setIsRecording(true)

      toast({
        title: "Recording Started",
        description: "Video call is now being recorded",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording Error",
        description: "Could not start recording",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)

      toast({
        title: "Recording Stopped",
        description: "Processing and uploading recording...",
      })
    }
  }

  const uploadRecording = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("recording", blob, `room-${roomId}-${Date.now()}.webm`)
      formData.append("roomId", roomId)

      const response = await fetch("/api/video/recordings", {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      toast({
        title: "Recording Saved",
        description: "Video recording has been saved successfully",
      })
    } catch (error) {
      console.error("Error uploading recording:", error)
      toast({
        title: "Upload Error",
        description: "Failed to save recording",
        variant: "destructive",
      })
    }
  }

  const sendChatMessage = (message: string) => {
    webrtcConnections.current.forEach((connection) => {
      connection.sendDataChannelMessage({
        type: "chat",
        text: message,
        user: userName,
        timestamp: new Date().toISOString(),
      })
    })

    // Add to local chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: userName,
        message,
        timestamp: new Date(),
      },
    ])
  }

  const leaveCall = async () => {
    cleanup()
    onLeave?.()
  }

  const cleanup = () => {
    // Stop local stream
    localStream.current?.getTracks().forEach((track) => track.stop())

    // Close all WebRTC connections
    webrtcConnections.current.forEach((connection) => {
      connection.disconnect()
    })
    webrtcConnections.current.clear()

    // Disconnect signaling
    signalingClient.current?.disconnect()

    // Stop recording if active
    if (isRecording) {
      stopRecording()
    }

    setIsConnected(false)
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
          {/* Local Video */}
          <Card className="relative overflow-hidden bg-gray-900">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {userName} (You)
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              {!isVideoEnabled && (
                <Badge variant="destructive" className="text-xs">
                  <VideoOff className="h-3 w-3" />
                </Badge>
              )}
              {!isAudioEnabled && (
                <Badge variant="destructive" className="text-xs">
                  <MicOff className="h-3 w-3" />
                </Badge>
              )}
              {isScreenSharing && (
                <Badge variant="secondary" className="text-xs">
                  <Monitor className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </Card>

          {/* Remote Videos */}
          {Array.from(participants.values())
            .filter((p) => p.id !== userId)
            .map((participant) => (
              <RemoteVideo key={participant.id} participant={participant} />
            ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
        <Button
          variant={isVideoEnabled ? "default" : "destructive"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full w-12 h-12"
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isAudioEnabled ? "default" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-12 h-12"
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? "secondary" : "outline"}
          size="lg"
          onClick={toggleScreenShare}
          className="rounded-full w-12 h-12"
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          className="rounded-full w-12 h-12"
        >
          {isRecording ? <StopCircle className="h-5 w-5" /> : <Record className="h-5 w-5" />}
        </Button>

        <Button variant="outline" size="lg" onClick={() => setShowChat(!showChat)} className="rounded-full w-12 h-12">
          <MessageSquare className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowParticipants(!showParticipants)}
          className="rounded-full w-12 h-12"
        >
          <Users className="h-5 w-5" />
        </Button>

        <Button variant="destructive" size="lg" onClick={leaveCall} className="rounded-full w-12 h-12">
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel messages={chatMessages} onSendMessage={sendChatMessage} onClose={() => setShowChat(false)} />
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <ParticipantsPanel
          participants={Array.from(participants.values())}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </div>
  )
}

interface RemoteVideoProps {
  participant: Participant
}

function RemoteVideo({ participant }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  return (
    <Card className="relative overflow-hidden bg-gray-900">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
        {participant.name}
      </div>
      <div className="absolute top-2 right-2 flex gap-1">
        {!participant.isVideoEnabled && (
          <Badge variant="destructive" className="text-xs">
            <VideoOff className="h-3 w-3" />
          </Badge>
        )}
        {!participant.isAudioEnabled && (
          <Badge variant="destructive" className="text-xs">
            <MicOff className="h-3 w-3" />
          </Badge>
        )}
        {participant.isScreenSharing && (
          <Badge variant="secondary" className="text-xs">
            <Monitor className="h-3 w-3" />
          </Badge>
        )}
      </div>
    </Card>
  )
}

interface ChatPanelProps {
  messages: Array<{ id: string; user: string; message: string; timestamp: Date }>
  onSendMessage: (message: string) => void
  onClose: () => void
}

function ChatPanel({ messages, onSendMessage, onClose }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  return (
    <div className="fixed right-4 top-4 bottom-20 w-80 bg-white rounded-lg shadow-lg flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Chat</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <div className="font-medium text-blue-600">{msg.user}</div>
            <div className="text-gray-800">{msg.message}</div>
            <div className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  )
}

interface ParticipantsPanelProps {
  participants: Participant[]
  onClose: () => void
}

function ParticipantsPanel({ participants, onClose }: ParticipantsPanelProps) {
  return (
    <div className="fixed left-4 top-4 bottom-20 w-64 bg-white rounded-lg shadow-lg flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Participants ({participants.length})</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{participant.name}</div>
              <div className="flex gap-1">
                {!participant.isVideoEnabled && <VideoOff className="h-3 w-3 text-red-500" />}
                {!participant.isAudioEnabled && <MicOff className="h-3 w-3 text-red-500" />}
                {participant.isScreenSharing && <Monitor className="h-3 w-3 text-blue-500" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
