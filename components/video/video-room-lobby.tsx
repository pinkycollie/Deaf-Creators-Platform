"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Video, Users, Plus, Clock, Play } from "lucide-react"

interface VideoRoomLobbyProps {
  tenantId: string
  userId: string
  onJoinRoom: (roomId: string) => void
}

interface VideoRoom {
  id: string
  name: string
  description: string
  room_type: string
  max_participants: number
  created_by_user: {
    username: string
    full_name: string
  }
  participants: Array<{
    user: {
      username: string
      full_name: string
    }
    role: string
    joined_at: string
    left_at: string | null
  }>
  created_at: string
}

export function VideoRoomLobby({ tenantId, userId, onJoinRoom }: VideoRoomLobbyProps) {
  const [rooms, setRooms] = useState<VideoRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    room_type: "conversation",
    max_participants: 10,
  })
  const [isCreating, setIsCreating] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchRooms()
  }, [tenantId])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/video/rooms", {
        headers: {
          "x-tenant-id": tenantId,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch rooms")

      const { rooms } = await response.json()
      setRooms(rooms)
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast({
        title: "Error",
        description: "Failed to load video rooms",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room name",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/video/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify(createForm),
      })

      if (!response.ok) throw new Error("Failed to create room")

      const { room } = await response.json()

      toast({
        title: "Success",
        description: "Video room created successfully!",
      })

      setCreateForm({
        name: "",
        description: "",
        room_type: "conversation",
        max_participants: 10,
      })
      setShowCreateForm(false)
      fetchRooms()

      // Auto-join the created room
      onJoinRoom(room.id)
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Error",
        description: "Failed to create video room",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/video/rooms/${roomId}/join`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to join room")
      }

      onJoinRoom(roomId)
    } catch (error: any) {
      console.error("Error joining room:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join video room",
        variant: "destructive",
      })
    }
  }

  const getActiveParticipants = (room: VideoRoom) => {
    return room.participants.filter((p) => !p.left_at).length
  }

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case "presentation":
        return <Play className="h-4 w-4" />
      case "recording":
        return <Video className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoomTypeBadge = (type: string) => {
    const variants = {
      conversation: "default",
      presentation: "secondary",
      recording: "destructive",
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || "default"}>
        {getRoomTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ASL Video Rooms</h2>
          <p className="text-muted-foreground">Join or create video rooms for ASL conversations [^2]</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </div>

      {/* Create Room Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Video Room</CardTitle>
            <CardDescription>Set up a new space for ASL conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter room name"
              />
            </div>

            <div>
              <Label htmlFor="room-description">Description (Optional)</Label>
              <Textarea
                id="room-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this room"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room-type">Room Type</Label>
                <select
                  id="room-type"
                  value={createForm.room_type}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, room_type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="conversation">Conversation</option>
                  <option value="presentation">Presentation</option>
                  <option value="recording">Recording Session</option>
                </select>
              </div>

              <div>
                <Label htmlFor="max-participants">Max Participants</Label>
                <Input
                  id="max-participants"
                  type="number"
                  min="2"
                  max="50"
                  value={createForm.max_participants}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, max_participants: Number.parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRoom} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{room.name}</CardTitle>
                  <CardDescription className="text-sm">Created by {room.created_by_user.username}</CardDescription>
                </div>
                {getRoomTypeBadge(room.room_type)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.description && <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {getActiveParticipants(room)} / {room.max_participants}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(room.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Active Participants */}
              {getActiveParticipants(room) > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Active Participants:</p>
                  <div className="flex flex-wrap gap-1">
                    {room.participants
                      .filter((p) => !p.left_at)
                      .slice(0, 3)
                      .map((participant, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {participant.user.username}
                          {participant.role === "host" && " (Host)"}
                        </Badge>
                      ))}
                    {getActiveParticipants(room) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{getActiveParticipants(room) - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => handleJoinRoom(room.id)}
                disabled={getActiveParticipants(room) >= room.max_participants}
                className="w-full"
              >
                {getActiveParticipants(room) >= room.max_participants ? "Room Full" : "Join Room"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Active Rooms</h3>
            <p className="text-muted-foreground mb-4">Create the first video room to start ASL conversations.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Room
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
