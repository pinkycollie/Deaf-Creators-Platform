import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { validateTenantAccess } from "@/lib/security"

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
    const { roomId, gestureData } = body

    const { data: gesture, error } = await supabaseAdmin
      .from("asl_gestures")
      .insert({
        tenant_id: tenantId,
        room_id: roomId,
        user_id: session.user.id,
        gesture_data: gestureData,
        confidence_score: gestureData.confidence,
        session_id: `${roomId}-${session.user.id}-${Date.now()}`,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ gesture })
  } catch (error) {
    console.error("Error storing gesture data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabaseAdmin
      .from("asl_gestures")
      .select(`
        *,
        user:users(id, username, full_name, avatar_url)
      `)
      .eq("tenant_id", tenantId)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (roomId) {
      query = query.eq("room_id", roomId)
    }

    const { data: gestures, error } = await query

    if (error) throw error

    return NextResponse.json({ gestures })
  } catch (error) {
    console.error("Error fetching gesture data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
