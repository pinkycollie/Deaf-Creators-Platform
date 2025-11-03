"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { VideoRoomLobby } from "@/components/video/video-room-lobby"
import { VideoCallInterface } from "@/components/video/video-call-interface"
import { ASLGestureRecognition } from "@/components/video/asl-gesture-recognition"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Video, Hand, Users } from "lucide-react"

export default function VideoPage() {
  const { data: session } = useSession()
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [showGestureRecognition, setShowGestureRecognition] = useState(false)

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please sign in to access video features.</p>
        </CardContent>
      </Card>
    )
  }

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoom(roomId)
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    setShowGestureRecognition(false)
  }

  if (currentRoom) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleLeaveRoom}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Room
          </Button>
          <Button variant="outline" onClick={() => setShowGestureRecognition(!showGestureRecognition)}>
            <Hand className="h-4 w-4 mr-2" />
            {showGestureRecognition ? "Hide" : "Show"} ASL Recognition
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <VideoCallInterface
              roomId={currentRoom}
              tenantId={session.user.tenantId}
              userId={session.user.id}
              userName={session.user.name || "User"}
              onLeave={handleLeaveRoom}
            />
          </div>

          {showGestureRecognition && (
            <div className="lg:col-span-1">
              <ASLGestureRecognition
                tenantId={session.user.tenantId}
                roomId={currentRoom}
                onGestureDetected={(gesture) => {
                  console.log("Gesture detected:", gesture)
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Features</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">HD Quality</div>
            <p className="text-xs text-muted-foreground">Crystal clear video optimized for ASL communication [^2]</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ASL Recognition</CardTitle>
            <Hand className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">AI-powered gesture recognition and analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multi-User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Up to 50</div>
            <p className="text-xs text-muted-foreground">Participants per room with role management</p>
          </CardContent>
        </Card>
      </div>

      <VideoRoomLobby tenantId={session.user.tenantId} userId={session.user.id} onJoinRoom={handleJoinRoom} />
    </div>
  )
}
