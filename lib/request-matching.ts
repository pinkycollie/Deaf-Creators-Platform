import { supabaseAdmin } from "./database"

// Types for request matching
export interface ContentRequest {
  id?: string
  tenant_id: string
  requester_id: string
  matched_content_id?: string
  assigned_creator_id?: string
  title: string
  description?: string
  requirements?: Record<string, unknown>
  tags?: string[]
  preferred_format?: string
  max_duration?: number
  budget_min?: number
  budget_max?: number
  deadline?: Date
  status?: "open" | "matched" | "assigned" | "in_progress" | "completed" | "cancelled"
  match_score?: number
  pricing_estimate?: number
}

export interface ContentMatch {
  content_id: string
  title: string
  description: string
  creator_id: string
  creator_name: string
  match_score: number
  tags: string[]
  duration: number
  format: string
  thumbnail_url?: string
  pricing?: number
}

export interface CreatorMatch {
  creator_id: string
  display_name: string
  specializations: string[]
  rating: number
  total_projects: number
  availability_score: number
  estimated_delivery_days: number
  pricing_estimate: number
  match_score: number
}

// Create content request
export async function createContentRequest(
  request: ContentRequest
): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin
    .from("content_requests")
    .insert({
      tenant_id: request.tenant_id,
      requester_id: request.requester_id,
      title: request.title,
      description: request.description,
      requirements: request.requirements || {},
      tags: request.tags || [],
      preferred_format: request.preferred_format,
      max_duration: request.max_duration,
      budget_min: request.budget_min,
      budget_max: request.budget_max,
      deadline: request.deadline,
      status: "open",
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating content request:", error)
    throw new Error(`Failed to create content request: ${error.message}`)
  }

  return { id: data.id }
}

// Find matching existing content
export async function findMatchingContent(
  tenantId: string,
  request: ContentRequest,
  limit: number = 10
): Promise<ContentMatch[]> {
  // Get published content from the tenant
  const { data: content, error } = await supabaseAdmin
    .from("content")
    .select(`
      id,
      title,
      description,
      creator_id,
      tags,
      duration,
      metadata,
      thumbnail_url,
      users!content_creator_id_fkey(full_name, username)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .eq("visibility", "public")

  if (error || !content) {
    console.error("Error fetching content:", error)
    return []
  }

  // Calculate match scores
  const matches: ContentMatch[] = []

  for (const item of content) {
    const score = calculateContentMatchScore(item, request)
    
    if (score > 0.3) { // Minimum threshold
      const user = item.users as { full_name?: string; username?: string } | null
      matches.push({
        content_id: item.id,
        title: item.title,
        description: item.description || "",
        creator_id: item.creator_id,
        creator_name: user?.full_name || user?.username || "Unknown",
        match_score: score,
        tags: item.tags || [],
        duration: item.duration || 0,
        format: (item.metadata as Record<string, unknown>)?.format as string || "mp4",
        thumbnail_url: item.thumbnail_url,
        pricing: estimateContentPrice(item, request),
      })
    }
  }

  // Sort by match score and return top matches
  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit)
}

// Calculate match score between content and request
function calculateContentMatchScore(
  content: {
    title: string
    description?: string | null
    tags?: string[] | null
    duration?: number | null
    metadata?: Record<string, unknown> | null
  },
  request: ContentRequest
): number {
  let score = 0
  let factors = 0

  // Tag matching (weighted 40%)
  if (request.tags && request.tags.length > 0 && content.tags) {
    const matchingTags = request.tags.filter((tag) =>
      content.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
    )
    score += (matchingTags.length / request.tags.length) * 0.4
    factors++
  }

  // Title/description keyword matching (weighted 30%)
  if (request.title || request.description) {
    const searchTerms = `${request.title} ${request.description || ""}`
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3)

    const contentText = `${content.title} ${content.description || ""}`.toLowerCase()

    const matchingTerms = searchTerms.filter((term) => contentText.includes(term))
    if (searchTerms.length > 0) {
      score += (matchingTerms.length / searchTerms.length) * 0.3
      factors++
    }
  }

  // Duration matching (weighted 15%)
  if (request.max_duration && content.duration) {
    if (content.duration <= request.max_duration) {
      score += 0.15
    } else {
      // Penalize if over duration
      score += 0.15 * Math.max(0, 1 - (content.duration - request.max_duration) / request.max_duration)
    }
    factors++
  }

  // Format matching (weighted 15%)
  if (request.preferred_format && content.metadata) {
    const contentFormat = (content.metadata as Record<string, unknown>).format as string
    if (contentFormat && contentFormat.toLowerCase() === request.preferred_format.toLowerCase()) {
      score += 0.15
    }
    factors++
  }

  return factors > 0 ? score : 0
}

// Estimate content price
function estimateContentPrice(
  content: {
    duration?: number | null
    metadata?: Record<string, unknown> | null
  },
  request: ContentRequest
): number {
  // Base pricing logic
  const basePricePerMinute = 5 // $5 per minute as base
  const duration = content.duration || 60 // Default 60 seconds

  let price = (duration / 60) * basePricePerMinute

  // Adjust based on request budget
  if (request.budget_min && request.budget_max) {
    const avgBudget = (request.budget_min + request.budget_max) / 2
    price = Math.min(price, avgBudget)
  }

  return Math.round(price * 100) / 100
}

// Find matching creators for a request
export async function findMatchingCreators(
  tenantId: string,
  request: ContentRequest,
  limit: number = 10
): Promise<CreatorMatch[]> {
  // Get active creator profiles
  const { data: creators, error } = await supabaseAdmin
    .from("creator_profiles")
    .select(`
      *,
      users!creator_profiles_user_id_fkey(full_name, username)
    `)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("is_verified", true)

  if (error || !creators) {
    console.error("Error fetching creators:", error)
    return []
  }

  const matches: CreatorMatch[] = []

  for (const creator of creators) {
    const score = calculateCreatorMatchScore(creator, request)
    const availability = await getCreatorAvailability(creator.user_id)

    if (score > 0.3 && availability.available) {
      const user = creator.users as { full_name?: string; username?: string } | null
      matches.push({
        creator_id: creator.user_id,
        display_name: creator.display_name || user?.full_name || "Creator",
        specializations: creator.specializations || [],
        rating: creator.rating || 0,
        total_projects: creator.total_projects || 0,
        availability_score: availability.score,
        estimated_delivery_days: estimateDeliveryDays(creator, request),
        pricing_estimate: estimateCreatorPrice(creator, request),
        match_score: score,
      })
    }
  }

  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit)
}

// Calculate creator match score
function calculateCreatorMatchScore(
  creator: {
    specializations?: string[] | null
    rating?: number | null
    total_projects?: number | null
  },
  request: ContentRequest
): number {
  let score = 0

  // Specialization matching (40%)
  if (request.requirements) {
    const reqType = (request.requirements as Record<string, unknown>).task_type as string
    if (reqType && creator.specializations?.includes(reqType)) {
      score += 0.4
    } else if (creator.specializations && creator.specializations.length > 0) {
      score += 0.2 // Partial match for having some specialization
    }
  }

  // Rating weight (30%)
  const rating = creator.rating || 0
  score += (rating / 5) * 0.3

  // Experience weight (30%)
  const projects = creator.total_projects || 0
  const experienceScore = Math.min(projects / 50, 1) // Cap at 50 projects
  score += experienceScore * 0.3

  return score
}

// Get creator availability
async function getCreatorAvailability(
  creatorId: string
): Promise<{ available: boolean; score: number }> {
  // Check pending tasks
  const { data: tasks, error } = await supabaseAdmin
    .from("creator_tasks")
    .select("id, deadline")
    .eq("assigned_to", creatorId)
    .in("status", ["pending", "in_progress"])

  if (error) {
    return { available: true, score: 1 }
  }

  const pendingTasks = tasks?.length || 0

  // Available if less than 3 pending tasks
  const available = pendingTasks < 3
  const score = Math.max(0, 1 - pendingTasks * 0.25)

  return { available, score }
}

// Estimate delivery days
function estimateDeliveryDays(
  creator: {
    total_projects?: number | null
  },
  request: ContentRequest
): number {
  // Base estimate: 5 days
  let days = 5

  // Faster for experienced creators
  const projects = creator.total_projects || 0
  if (projects > 20) {
    days -= 1
  }
  if (projects > 50) {
    days -= 1
  }

  // Longer for longer content
  if (request.max_duration) {
    days += Math.ceil(request.max_duration / 600) // +1 day per 10 minutes
  }

  return Math.max(1, days)
}

// Estimate creator price
function estimateCreatorPrice(
  creator: {
    rating?: number | null
    total_projects?: number | null
  },
  request: ContentRequest
): number {
  let basePrice = 100 // Base $100

  // Adjust for duration
  if (request.max_duration) {
    basePrice += (request.max_duration / 60) * 10 // +$10 per minute
  }

  // Premium for high-rated creators
  const rating = creator.rating || 0
  if (rating > 4.5) {
    basePrice *= 1.5
  } else if (rating > 4) {
    basePrice *= 1.25
  }

  // Premium for experienced creators
  const projects = creator.total_projects || 0
  if (projects > 50) {
    basePrice *= 1.3
  } else if (projects > 20) {
    basePrice *= 1.15
  }

  // Ensure within budget
  if (request.budget_max) {
    basePrice = Math.min(basePrice, request.budget_max)
  }

  return Math.round(basePrice * 100) / 100
}

// Match request to content or creator
export async function matchRequest(
  requestId: string
): Promise<{
  type: "content" | "creator" | "none"
  matches: ContentMatch[] | CreatorMatch[]
}> {
  const { data: request, error } = await supabaseAdmin
    .from("content_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (error || !request) {
    throw new Error("Request not found")
  }

  // First, try to find matching existing content
  const contentMatches = await findMatchingContent(request.tenant_id, request as ContentRequest)

  if (contentMatches.length > 0 && contentMatches[0].match_score > 0.7) {
    // Good content match found
    await supabaseAdmin
      .from("content_requests")
      .update({
        status: "matched",
        matched_content_id: contentMatches[0].content_id,
        match_score: contentMatches[0].match_score,
        pricing_estimate: contentMatches[0].pricing,
      })
      .eq("id", requestId)

    return { type: "content", matches: contentMatches }
  }

  // No good content match, find creators
  const creatorMatches = await findMatchingCreators(request.tenant_id, request as ContentRequest)

  if (creatorMatches.length > 0) {
    await supabaseAdmin
      .from("content_requests")
      .update({
        status: "matched",
        pricing_estimate: creatorMatches[0].pricing_estimate,
      })
      .eq("id", requestId)

    return { type: "creator", matches: creatorMatches }
  }

  return { type: "none", matches: [] }
}

// Assign creator to request
export async function assignCreatorToRequest(
  requestId: string,
  creatorId: string
): Promise<{ taskId: string }> {
  const { data: request, error } = await supabaseAdmin
    .from("content_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (error || !request) {
    throw new Error("Request not found")
  }

  // Create task for creator
  const { data: task, error: taskError } = await supabaseAdmin
    .from("creator_tasks")
    .insert({
      tenant_id: request.tenant_id,
      assigned_by: request.requester_id,
      assigned_to: creatorId,
      title: request.title,
      description: request.description,
      task_type: "video_creation",
      requirements: request.requirements,
      deadline: request.deadline,
      budget: request.pricing_estimate,
      currency: "USD",
      status: "pending",
    })
    .select("id")
    .single()

  if (taskError) {
    throw new Error(`Failed to create task: ${taskError.message}`)
  }

  // Update request status
  await supabaseAdmin
    .from("content_requests")
    .update({
      status: "assigned",
      assigned_creator_id: creatorId,
    })
    .eq("id", requestId)

  return { taskId: task.id }
}

// Get content requests by status
export async function getContentRequests(
  tenantId: string,
  status?: string,
  limit: number = 20
): Promise<ContentRequest[]> {
  let query = supabaseAdmin
    .from("content_requests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching content requests:", error)
    return []
  }

  return data || []
}

// Update request status
export async function updateRequestStatus(
  requestId: string,
  status: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("content_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (error) {
    throw new Error(`Failed to update request status: ${error.message}`)
  }
}

// Get request by ID
export async function getContentRequestById(
  requestId: string
): Promise<ContentRequest | null> {
  const { data, error } = await supabaseAdmin
    .from("content_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (error) {
    console.error("Error fetching content request:", error)
    return null
  }

  return data
}
