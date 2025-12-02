import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateTenantAccess } from "@/lib/security"
import {
  createContentRequest,
  findMatchingContent,
  findMatchingCreators,
  matchRequest,
  assignCreatorToRequest,
  getContentRequests,
  getContentRequestById,
} from "@/lib/request-matching"

// GET - Get content requests
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
    const requestId = searchParams.get("id")
    const status = searchParams.get("status") || undefined

    if (requestId) {
      const contentRequest = await getContentRequestById(requestId)
      if (!contentRequest) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }
      return NextResponse.json({ request: contentRequest })
    }

    const requests = await getContentRequests(tenantId, status)
    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching requests:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create or match requests
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
      case "create": {
        const {
          title,
          description,
          requirements,
          tags,
          preferredFormat,
          maxDuration,
          budgetMin,
          budgetMax,
          deadline,
        } = body

        if (!title) {
          return NextResponse.json(
            { error: "Title is required" },
            { status: 400 }
          )
        }

        const result = await createContentRequest({
          tenant_id: tenantId,
          requester_id: session.user.id,
          title,
          description,
          requirements,
          tags,
          preferred_format: preferredFormat,
          max_duration: maxDuration,
          budget_min: budgetMin,
          budget_max: budgetMax,
          deadline: deadline ? new Date(deadline) : undefined,
        })

        return NextResponse.json({ success: true, ...result })
      }

      case "search_content": {
        const matches = await findMatchingContent(tenantId, body)
        return NextResponse.json({ matches })
      }

      case "search_creators": {
        const matches = await findMatchingCreators(tenantId, body)
        return NextResponse.json({ matches })
      }

      case "match": {
        const { requestId } = body
        if (!requestId) {
          return NextResponse.json(
            { error: "Request ID is required" },
            { status: 400 }
          )
        }

        const result = await matchRequest(requestId)
        return NextResponse.json({ success: true, ...result })
      }

      case "assign": {
        const { requestId, creatorId } = body
        if (!requestId || !creatorId) {
          return NextResponse.json(
            { error: "Request ID and Creator ID are required" },
            { status: 400 }
          )
        }

        const result = await assignCreatorToRequest(requestId, creatorId)
        return NextResponse.json({ success: true, ...result })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing request action:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
