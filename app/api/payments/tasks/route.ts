import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateTenantAccess } from "@/lib/security"
import {
  createTask,
  getCreatorTasks,
  updateTaskStatus,
  recordEarning,
} from "@/lib/creator-payments"

// GET - Get tasks for creator
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
    const status = searchParams.get("status") || undefined
    const creatorId = searchParams.get("creatorId") || session.user.id

    const tasks = await getCreatorTasks(tenantId, creatorId, status)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create or update task
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
          assignedTo,
          contentId,
          title,
          description,
          taskType,
          requirements,
          deadline,
          budget,
          priority,
          deliverables,
        } = body

        if (!assignedTo || !title || !taskType) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          )
        }

        const result = await createTask({
          tenant_id: tenantId,
          assigned_by: session.user.id,
          assigned_to: assignedTo,
          content_id: contentId,
          title,
          description,
          task_type: taskType,
          requirements,
          deadline: deadline ? new Date(deadline) : undefined,
          budget,
          priority,
          deliverables,
        })

        return NextResponse.json({ success: true, ...result })
      }

      case "update_status": {
        const { taskId, status, rejectionReason } = body

        if (!taskId || !status) {
          return NextResponse.json(
            { error: "Missing taskId or status" },
            { status: 400 }
          )
        }

        await updateTaskStatus(taskId, status, rejectionReason)

        // If task is approved/completed, create earning record
        if (status === "approved" || status === "completed") {
          const { budget } = body
          if (budget) {
            await recordEarning({
              tenant_id: tenantId,
              creator_id: body.creatorId,
              task_id: taskId,
              earning_type: "task_payment",
              description: `Payment for task: ${body.taskTitle || taskId}`,
              gross_amount: budget,
              net_amount: budget * 0.9, // 10% platform fee
            })
          }
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing task action:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
