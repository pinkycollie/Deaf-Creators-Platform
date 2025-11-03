import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { logAuditEvent, validateTenantAccess } from "@/lib/security"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId || !(await validateTenantAccess(tenantId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: rooms, error } = await supabaseAdmin
      .from("video_rooms")
      .select(`
        *,
        created_by_user:users!video_rooms_created_by_fkey(id, username, full_name, avatar_url),
        participants:video_room_participants(
          user_id,
          role,
          joined_at,
          left_at,
          user:users(id, username, full_name, avatar_url)
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error("Error fetching video rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenantId = request.headers.get("x-tenant-id")
    if (!tenantId || !(await validateTenantAccess(tenantId, session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, room_type = "conversation", max_participants = 10, settings = {} } = body

    const { data: room, error } = await supabaseAdmin
      .from("video_rooms")
      .insert({
        tenant_id: tenantId,
        name,
        description,
        room_type,
        max_participants,
        settings,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as host participant
    await supabaseAdmin.from("video_room_participants").insert({
      tenant_id: tenantId,
      room_id: room.id,
      user_id: session.user.id,
      role: "host",
    })

    // Log audit event
    await logAuditEvent(tenantId, session.user.id, "video_room_created", "video_room", room.id, {
      name,
      room_type,
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error creating video room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
