import Pusher from "pusher"
import { supabaseAdmin } from "./database"

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export async function sendNotification(
  tenantId: string,
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any,
) {
  // Store in database
  const { data: notification } = await supabaseAdmin
    .from("notifications")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      type,
      title,
      message,
      data,
    })
    .select()
    .single()

  // Send real-time notification
  await pusher.trigger(`tenant-${tenantId}`, `user-${userId}`, {
    type: "notification",
    data: notification,
  })

  return notification
}

export async function sendBroadcast(tenantId: string, message: any) {
  await pusher.trigger(`tenant-${tenantId}`, "broadcast", message)
}
