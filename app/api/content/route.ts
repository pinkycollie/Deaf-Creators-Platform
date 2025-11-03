import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/database"
import { logAuditEvent, validateTenantAccess } from "@/lib/security"
import { moderateContent } from "@/lib/security"

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

    const { data: content, error } = await supabaseAdmin
      .from("content")
      .select(`
        *,
        creator:users(id, username, full_name, avatar_url),
        nft_tokens(*)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error fetching content:", error)
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
    const { title, description, content_type, file_url, thumbnail_url } = body

    // Content moderation
    const moderationResult = await moderateContent(description, "text")

    const { data: content, error } = await supabaseAdmin
      .from("content")
      .insert({
        tenant_id: tenantId,
        creator_id: session.user.id,
        title,
        description,
        content_type,
        file_url,
        thumbnail_url,
        status: moderationResult.flagged ? "under_review" : "draft",
      })
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await logAuditEvent(tenantId, session.user.id, "content_created", "content", content.id, { title, content_type })

    // Add to moderation queue if flagged
    if (moderationResult.flagged) {
      await supabaseAdmin.from("moderation_queue").insert({
        tenant_id: tenantId,
        content_id: content.id,
        ai_score: Math.max(...Object.values(moderationResult.category_scores)),
        ai_flags: Object.keys(moderationResult.categories).filter((key) => moderationResult.categories[key]),
      })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error creating content:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
