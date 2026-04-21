import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { validateTenantAccess } from "@/lib/security"
import {
  createProcessingJob,
  getProcessingJob,
  getPendingJobs,
  processVideo,
} from "@/lib/video-processing"

// POST - Create a new video processing job
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
    const { contentId, inputUrl, jobType, settings, priority } = body

    if (!inputUrl || !jobType) {
      return NextResponse.json(
        { error: "Missing required fields: inputUrl and jobType" },
        { status: 400 }
      )
    }

    const job = await createProcessingJob({
      tenant_id: tenantId,
      content_id: contentId,
      creator_id: session.user.id,
      input_url: inputUrl,
      job_type: jobType,
      priority: priority || 5,
      settings: settings || {},
    })

    // Optionally start processing immediately
    if (body.processImmediately) {
      // Process asynchronously
      processVideo(job.id, settings).catch((err) =>
        console.error("Background processing error:", err)
      )
    }

    return NextResponse.json({ success: true, job })
  } catch (error) {
    console.error("Error creating processing job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get processing jobs
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
    const jobId = searchParams.get("jobId")
    const status = searchParams.get("status")

    if (jobId) {
      const job = await getProcessingJob(jobId)
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }
      return NextResponse.json({ job })
    }

    if (status === "pending") {
      const jobs = await getPendingJobs(20)
      return NextResponse.json({ jobs })
    }

    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching processing jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
