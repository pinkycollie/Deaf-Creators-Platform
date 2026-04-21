import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateTenantAccess } from "@/lib/security"
import {
  createCreatorProfile,
  getCreatorProfile,
  getEarningsSummary,
  getPaymentHistory,
  processPayout,
  createStripeConnectAccount,
} from "@/lib/creator-payments"

// GET - Get payment information
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
    const action = searchParams.get("action")
    const creatorId = searchParams.get("creatorId") || session.user.id

    switch (action) {
      case "profile": {
        const profile = await getCreatorProfile(tenantId, creatorId)
        return NextResponse.json({ profile })
      }

      case "earnings": {
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const summary = await getEarningsSummary(
          tenantId,
          creatorId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        )
        return NextResponse.json({ summary })
      }

      case "history": {
        const limit = parseInt(searchParams.get("limit") || "20")
        const history = await getPaymentHistory(tenantId, creatorId, limit)
        return NextResponse.json({ history })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching payment info:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Payment actions
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
    const { action } = body

    switch (action) {
      case "create_profile": {
        const { displayName, bio, specializations, paymentMethod } = body
        const result = await createCreatorProfile({
          tenant_id: tenantId,
          user_id: session.user.id,
          display_name: displayName,
          bio,
          specializations,
          payment_method: paymentMethod,
        })
        return NextResponse.json({ success: true, ...result })
      }

      case "setup_stripe": {
        const { email, country } = body
        const result = await createStripeConnectAccount(
          tenantId,
          session.user.id,
          email || session.user.email,
          country || "US"
        )
        return NextResponse.json({ success: true, ...result })
      }

      case "request_payout": {
        const { earningIds } = body
        if (!earningIds || !Array.isArray(earningIds) || earningIds.length === 0) {
          return NextResponse.json(
            { error: "No earnings specified for payout" },
            { status: 400 }
          )
        }
        const result = await processPayout(tenantId, session.user.id, earningIds)
        return NextResponse.json({ success: true, ...result })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing payment action:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
