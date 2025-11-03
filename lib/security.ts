import { ratelimit } from "./rate-limit"
import { supabaseAdmin } from "./database"
import { headers } from "next/headers"

export async function validateTenantAccess(tenantId: string, userId?: string) {
  if (!userId) return false

  const { data: user } = await supabaseAdmin.from("users").select("tenant_id").eq("id", userId).single()

  return user?.tenant_id === tenantId
}

export async function logAuditEvent(
  tenantId: string,
  userId: string | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
) {
  const headersList = headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip")
  const userAgent = headersList.get("user-agent")

  await supabaseAdmin.from("audit_logs").insert({
    tenant_id: tenantId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
    ip_address: ip,
    user_agent: userAgent,
  })
}

export async function checkRateLimit(identifier: string, limit = 100, window = 60000) {
  const { success, remaining } = await ratelimit.limit(identifier)
  return { success, remaining }
}

// Content moderation using AI [^1]
export async function moderateContent(content: string, contentType: "text" | "image" | "video") {
  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: content,
      }),
    })

    const result = await response.json()

    return {
      flagged: result.results[0].flagged,
      categories: result.results[0].categories,
      category_scores: result.results[0].category_scores,
    }
  } catch (error) {
    console.error("Content moderation error:", error)
    return { flagged: false, categories: {}, category_scores: {} }
  }
}
