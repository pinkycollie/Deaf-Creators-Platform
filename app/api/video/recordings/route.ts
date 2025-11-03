import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { uploadFile } from "@/lib/storage"
import { logAuditEvent, validateTenantAccess } from "@/lib/security"

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

    const formData = await request.formData()
    const recordingFile = formData.get("recording") as File
    const roomId = formData.get("roomId") as string

    if (!recordingFile || !roomId) {
      return NextResponse.json({ error: "Missing recording file or room ID" }, { status: 400 })
    }

    // Upload recording to storage
    const key = `recordings/${tenantId}/${roomId}/${Date.now()}-${recordingFile.name}`
    const fileUrl = await uploadFile(recordingFile, key)

    // Get room participants for metadata
    const { data: participants } = await supabaseAdmin
      .from("video_room_participants")
      .select("user:users(username)")
      .eq("room_id", roomId)
      .is("left_at", null)

    const participantNames = participants?.map((p: any) => p.user.username) || []

    // Store recording metadata
    const { data: recording, error } = await supabaseAdmin
      .from("video_recordings")
      .insert({
        tenant_id: tenantId,
        room_id: roomId,
        recorded_by: session.user.id,
        file_url: fileUrl,
        file_size: recordingFile.size,
        participants: participantNames,
        metadata: {
          originalName: recordingFile.name,
          mimeType: recordingFile.type,
          uploadedAt: new Date().toISOString(),
        },
        status: "completed",
      })
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await logAuditEvent(tenantId, session.user.id, "video_recording_saved", "video_recording", recording.id, {
      roomId,
      fileSize: recordingFile.size,
      participants: participantNames.length,
    })

    return NextResponse.json({ recording })
  } catch (error) {
    console.error("Error saving video recording:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
