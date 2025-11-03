import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { logAuditEvent, validateTenantAccess } from "@/lib/security"

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId || !(await validateTenantAccess(tenantId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { roomId } = params

    // Check if room exists and is active
    const { data: room } = await supabaseAdmin
      .from("video_rooms")
      .select("*, participants:video_room_participants(*)")
      .eq("id", roomId)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single()

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check participant limit
    const activeParticipants = room.participants.filter((p: any) => !p.left_at)
    if (activeParticipants.length >= room.max_participants) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    // Add user as participant
    const { data: participant, error } = await supabaseAdmin
      .from("video_room_participants")
      .upsert({
        tenant_id: tenantId,
        room_id: roomId,
        user_id: session.user.id,
        role: "participant",
        joined_at: new Date().toISOString(),
        left_at: null,
      })
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await logAuditEvent(tenantId, session.user.id, "video_room_joined", "video_room", roomId)

    return NextResponse.json({ participant, room })
  } catch (error) {
    console.error("Error joining video room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
