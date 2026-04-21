import { supabaseAdmin } from "./database"

// Types for video processing
export interface VideoProcessingJob {
  id?: string
  tenant_id: string
  content_id?: string
  creator_id: string
  input_url: string
  output_url?: string
  job_type: "transcoding" | "analysis" | "thumbnail" | "enhancement"
  status?: "pending" | "processing" | "completed" | "failed"
  priority?: number
  progress?: number
  settings?: VideoProcessingSettings
  ai_analysis?: AIAnalysisResult
  error_message?: string
}

export interface VideoProcessingSettings {
  resolution?: string // e.g., "1080p", "720p", "4k"
  format?: string // e.g., "mp4", "webm", "hls"
  bitrate?: number
  framerate?: number
  codec?: string
  audio_codec?: string
  generate_captions?: boolean
  asl_detection?: boolean
}

export interface AIAnalysisResult {
  tags?: string[]
  scenes?: SceneAnalysis[]
  quality_metrics?: QualityMetrics
  content_moderation?: ContentModerationResult
  asl_detection?: ASLDetectionResult
}

export interface SceneAnalysis {
  scene_number: number
  start_time: number
  end_time: number
  description: string
  tags: string[]
  confidence: number
}

export interface QualityMetrics {
  overall_score: number
  video_quality: number
  audio_quality: number
  resolution_score: number
  lighting_score: number
  stability_score: number
}

export interface ContentModerationResult {
  is_safe: boolean
  flagged_categories: string[]
  confidence: number
}

export interface ASLDetectionResult {
  contains_asl: boolean
  asl_segments: Array<{
    start_time: number
    end_time: number
    confidence: number
    detected_signs?: string[]
  }>
}

// Create a video processing job
export async function createProcessingJob(
  job: VideoProcessingJob
): Promise<{ id: string; status: string }> {
  const { data, error } = await supabaseAdmin
    .from("video_processing_jobs")
    .insert({
      tenant_id: job.tenant_id,
      content_id: job.content_id,
      creator_id: job.creator_id,
      input_url: job.input_url,
      job_type: job.job_type,
      priority: job.priority || 5,
      settings: job.settings || {},
      status: "pending",
    })
    .select("id, status")
    .single()

  if (error) {
    console.error("Error creating processing job:", error)
    throw new Error(`Failed to create processing job: ${error.message}`)
  }

  return data
}

// Update job status
export async function updateJobStatus(
  jobId: string,
  status: string,
  progress?: number,
  errorMessage?: string,
  outputUrl?: string,
  aiAnalysis?: AIAnalysisResult
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (progress !== undefined) updateData.progress = progress
  if (errorMessage) updateData.error_message = errorMessage
  if (outputUrl) updateData.output_url = outputUrl
  if (aiAnalysis) updateData.ai_analysis = aiAnalysis

  if (status === "processing") {
    updateData.started_at = new Date().toISOString()
  } else if (status === "completed" || status === "failed") {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from("video_processing_jobs")
    .update(updateData)
    .eq("id", jobId)

  if (error) {
    console.error("Error updating job status:", error)
    throw new Error(`Failed to update job status: ${error.message}`)
  }
}

// Get pending jobs for processing
export async function getPendingJobs(
  limit: number = 10
): Promise<VideoProcessingJob[]> {
  const { data, error } = await supabaseAdmin
    .from("video_processing_jobs")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("Error fetching pending jobs:", error)
    throw new Error(`Failed to fetch pending jobs: ${error.message}`)
  }

  return data || []
}

// Simulate video analysis (in real implementation, use FFmpeg and AI models)
export async function analyzeVideo(
  inputUrl: string,
  options: { analyzeScenes?: boolean; detectASL?: boolean; moderateContent?: boolean } = {}
): Promise<AIAnalysisResult> {
  // Mock implementation - in production, integrate with:
  // - FFmpeg for video processing
  // - OpenAI Vision API or similar for scene analysis
  // - Custom ASL detection models
  // - Content moderation APIs

  const result: AIAnalysisResult = {
    tags: ["educational", "accessibility", "asl"],
    quality_metrics: {
      overall_score: 0.85,
      video_quality: 0.9,
      audio_quality: 0.8,
      resolution_score: 0.95,
      lighting_score: 0.75,
      stability_score: 0.85,
    },
  }

  if (options.analyzeScenes) {
    result.scenes = [
      {
        scene_number: 1,
        start_time: 0,
        end_time: 30,
        description: "Introduction segment",
        tags: ["introduction", "greeting"],
        confidence: 0.92,
      },
      {
        scene_number: 2,
        start_time: 30,
        end_time: 120,
        description: "Main content segment",
        tags: ["educational", "demonstration"],
        confidence: 0.88,
      },
    ]
  }

  if (options.detectASL) {
    result.asl_detection = {
      contains_asl: true,
      asl_segments: [
        {
          start_time: 5,
          end_time: 25,
          confidence: 0.95,
          detected_signs: ["hello", "welcome", "learn"],
        },
      ],
    }
  }

  if (options.moderateContent) {
    result.content_moderation = {
      is_safe: true,
      flagged_categories: [],
      confidence: 0.98,
    }
  }

  return result
}

// Create video scenes from analysis
export async function createVideoScenes(
  tenantId: string,
  contentId: string,
  scenes: SceneAnalysis[]
): Promise<string[]> {
  const sceneRecords = scenes.map((scene) => ({
    tenant_id: tenantId,
    content_id: contentId,
    scene_number: scene.scene_number,
    start_time: scene.start_time,
    end_time: scene.end_time,
    duration: scene.end_time - scene.start_time,
    tags: scene.tags,
    description: scene.description,
    ai_confidence: scene.confidence,
  }))

  const { data, error } = await supabaseAdmin
    .from("video_scenes")
    .insert(sceneRecords)
    .select("id")

  if (error) {
    console.error("Error creating video scenes:", error)
    throw new Error(`Failed to create video scenes: ${error.message}`)
  }

  return data.map((s) => s.id)
}

// Store AI analysis results
export async function storeAIAnalysis(
  tenantId: string,
  contentId: string,
  modelName: string,
  analysisType: string,
  results: Record<string, unknown>,
  confidenceScore?: number,
  processingTimeMs?: number
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("ai_analysis_results")
    .insert({
      tenant_id: tenantId,
      content_id: contentId,
      model_name: modelName,
      analysis_type: analysisType,
      results,
      confidence_score: confidenceScore,
      processing_time_ms: processingTimeMs,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error storing AI analysis:", error)
    throw new Error(`Failed to store AI analysis: ${error.message}`)
  }

  return data.id
}

// Add video contributor
export async function addVideoContributor(
  tenantId: string,
  contentId: string,
  userId: string,
  contributionType: string,
  contributionPercentage: number,
  sceneIds?: string[],
  description?: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("video_contributors")
    .insert({
      tenant_id: tenantId,
      content_id: contentId,
      user_id: userId,
      contribution_type: contributionType,
      contribution_percentage: contributionPercentage,
      scenes: sceneIds,
      description,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error adding contributor:", error)
    throw new Error(`Failed to add contributor: ${error.message}`)
  }

  return data.id
}

// Create quality review
export async function createQualityReview(
  tenantId: string,
  contentId: string,
  reviewType: "ai_automated" | "human_review",
  scores: {
    quality_score?: number
    technical_score?: number
    content_score?: number
    accessibility_score?: number
  },
  issues?: Array<{ type: string; description: string; severity: string }>,
  reviewerId?: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("video_quality_reviews")
    .insert({
      tenant_id: tenantId,
      content_id: contentId,
      reviewer_id: reviewerId,
      review_type: reviewType,
      ...scores,
      issues: issues || [],
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating quality review:", error)
    throw new Error(`Failed to create quality review: ${error.message}`)
  }

  return data.id
}

// Get video processing job by ID
export async function getProcessingJob(
  jobId: string
): Promise<VideoProcessingJob | null> {
  const { data, error } = await supabaseAdmin
    .from("video_processing_jobs")
    .select("*")
    .eq("id", jobId)
    .single()

  if (error) {
    console.error("Error fetching processing job:", error)
    return null
  }

  return data
}

// Get processing jobs by content ID
export async function getJobsByContentId(
  contentId: string
): Promise<VideoProcessingJob[]> {
  const { data, error } = await supabaseAdmin
    .from("video_processing_jobs")
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching jobs by content:", error)
    return []
  }

  return data || []
}

// Process video (main processing function)
export async function processVideo(
  jobId: string,
  options: VideoProcessingSettings = {}
): Promise<{ success: boolean; outputUrl?: string; error?: string }> {
  try {
    const job = await getProcessingJob(jobId)
    if (!job) {
      throw new Error("Job not found")
    }

    // Update status to processing
    await updateJobStatus(jobId, "processing", 0)

    // Simulate processing steps
    await updateJobStatus(jobId, "processing", 25)

    // Analyze video
    const analysis = await analyzeVideo(job.input_url, {
      analyzeScenes: true,
      detectASL: true,
      moderateContent: true,
    })

    await updateJobStatus(jobId, "processing", 50)

    // Store analysis results
    if (job.content_id && job.tenant_id) {
      await storeAIAnalysis(
        job.tenant_id,
        job.content_id,
        "video-analyzer-v1",
        job.job_type,
        analysis as unknown as Record<string, unknown>,
        analysis.quality_metrics?.overall_score
      )

      // Create scenes if analyzed
      if (analysis.scenes && analysis.scenes.length > 0) {
        await createVideoScenes(job.tenant_id, job.content_id, analysis.scenes)
      }
    }

    await updateJobStatus(jobId, "processing", 75)

    // Mock output URL (in real implementation, this would be the transcoded file)
    const outputUrl = job.input_url.replace(/\.[^.]+$/, "_processed.mp4")

    await updateJobStatus(jobId, "completed", 100, undefined, outputUrl, analysis)

    return { success: true, outputUrl }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await updateJobStatus(jobId, "failed", undefined, errorMessage)
    return { success: false, error: errorMessage }
  }
}
