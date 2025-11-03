import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUploadUrl } from "@/lib/storage"
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

    const { filename, contentType } = await request.json()

    // Generate unique key
    const key = `${tenantId}/${session.user.id}/${Date.now()}-${filename}`

    // Get signed upload URL
    const uploadUrl = await getUploadUrl(key, contentType)

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl: `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`,
    })
  } catch (error) {
    console.error("Error generating upload URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
