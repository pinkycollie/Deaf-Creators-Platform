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

    const formData = await request.formData()
    const socketId = formData.get("socket_id") as string
    const channelName = formData.get("channel_name") as string

    // Validate channel access
    if (channelName.startsWith(`private-room-${tenantId}-`)) {
      const auth = pusher.authorizeChannel(socketId, channelName, {
        user_id: session.user.id,
        user_info: {
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
        },
      })

      return NextResponse.json(auth)
    }

    return NextResponse.json({ error: "Unauthorized channel" }, { status: 403 })
  } catch (error) {
    console.error("Pusher auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
