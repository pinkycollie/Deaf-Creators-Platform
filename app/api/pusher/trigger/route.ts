import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Pusher from "pusher"
import { validateTenantAccess } from "@/lib/security"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

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

    const { channel, event, data } = await request.json()

    // Validate channel access
    if (!channel.startsWith(`private-room-${tenantId}-`)) {
      return NextResponse.json({ error: "Unauthorized channel" }, { status: 403 })
    }

    await pusher.trigger(channel, event, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Pusher trigger error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
