import { supabaseAdmin } from "./database"
import Stripe from "stripe"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Types for creator payments
export interface CreatorProfile {
  id?: string
  tenant_id: string
  user_id: string
  display_name: string
  bio?: string
  specializations?: string[]
  payment_method?: "stripe" | "paypal" | "bank_transfer" | "crypto"
  stripe_account_id?: string
  paypal_email?: string
  crypto_wallet_address?: string
  payout_threshold?: number
  preferred_currency?: string
  is_verified?: boolean
  status?: "active" | "pending" | "suspended"
}

export interface CreatorTask {
  id?: string
  tenant_id: string
  assigned_by: string
  assigned_to: string
  content_id?: string
  title: string
  description?: string
  task_type: "video_creation" | "editing" | "translation" | "asl_interpretation"
  requirements?: Record<string, unknown>
  deadline?: Date
  budget?: number
  currency?: string
  status?: "pending" | "in_progress" | "submitted" | "approved" | "rejected" | "completed"
  priority?: number
  deliverables?: Array<{ type: string; description: string }>
}

export interface CreatorEarning {
  id?: string
  tenant_id: string
  creator_id: string
  content_id?: string
  task_id?: string
  earning_type: "task_payment" | "royalty" | "bonus" | "tip" | "nft_sale"
  description?: string
  gross_amount: number
  platform_fee?: number
  tax_amount?: number
  net_amount: number
  currency?: string
  source_details?: Record<string, unknown>
  period_start?: Date
  period_end?: Date
  status?: "pending" | "confirmed" | "paid" | "disputed"
}

export interface RoyaltyRule {
  id?: string
  tenant_id: string
  content_id?: string
  rule_name: string
  rule_type: "view_based" | "scene_based" | "revenue_share" | "flat_rate"
  configuration: {
    percentage?: number
    rate_per_view?: number
    minimum_views?: number
    splits?: Array<{ user_id: string; percentage: number }>
    flat_amount?: number
  }
  is_active?: boolean
  priority?: number
}

export interface PaymentTransaction {
  id?: string
  tenant_id: string
  creator_id: string
  earnings_ids: string[]
  payment_method: string
  payment_provider: string
  gross_amount: number
  fee_amount?: number
  net_amount: number
  currency?: string
  status?: "pending" | "processing" | "completed" | "failed" | "refunded"
}

export interface EarningsSummary {
  total_gross: number
  total_platform_fees: number
  total_taxes: number
  total_net: number
  pending_amount: number
  paid_amount: number
  by_type: Record<string, { gross: number; net: number; count: number }>
  by_content: Array<{ content_id: string; title: string; amount: number }>
}

// Create or update creator profile
export async function createCreatorProfile(
  profile: CreatorProfile
): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin
    .from("creator_profiles")
    .upsert(
      {
        tenant_id: profile.tenant_id,
        user_id: profile.user_id,
        display_name: profile.display_name,
        bio: profile.bio,
        specializations: profile.specializations,
        payment_method: profile.payment_method,
        stripe_account_id: profile.stripe_account_id,
        paypal_email: profile.paypal_email,
        crypto_wallet_address: profile.crypto_wallet_address,
        payout_threshold: profile.payout_threshold || 50.0,
        preferred_currency: profile.preferred_currency || "USD",
        status: profile.status || "pending",
      },
      { onConflict: "tenant_id,user_id" }
    )
    .select("id")
    .single()

  if (error) {
    console.error("Error creating creator profile:", error)
    throw new Error(`Failed to create creator profile: ${error.message}`)
  }

  return { id: data.id }
}

// Get creator profile
export async function getCreatorProfile(
  tenantId: string,
  userId: string
): Promise<CreatorProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("creator_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching creator profile:", error)
    return null
  }

  return data
}

// Create Stripe Connect account for creator
export async function createStripeConnectAccount(
  tenantId: string,
  userId: string,
  email: string,
  country: string = "US"
): Promise<{ accountId: string; onboardingUrl: string }> {
  try {
    // Create Express account
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    // Update creator profile with Stripe account ID
    await supabaseAdmin
      .from("creator_profiles")
      .update({
        stripe_account_id: account.id,
        payment_method: "stripe",
      })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/onboarding?success=true`,
      type: "account_onboarding",
    })

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    }
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error)
    throw error
  }
}

// Create a task assignment
export async function createTask(task: CreatorTask): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin
    .from("creator_tasks")
    .insert({
      tenant_id: task.tenant_id,
      assigned_by: task.assigned_by,
      assigned_to: task.assigned_to,
      content_id: task.content_id,
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      requirements: task.requirements || {},
      deadline: task.deadline,
      budget: task.budget,
      currency: task.currency || "USD",
      status: "pending",
      priority: task.priority || 5,
      deliverables: task.deliverables || [],
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating task:", error)
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return { id: data.id }
}

// Update task status
export async function updateTaskStatus(
  taskId: string,
  status: string,
  rejectionReason?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "submitted") {
    updateData.submitted_at = new Date().toISOString()
  } else if (status === "approved") {
    updateData.approved_at = new Date().toISOString()
  } else if (status === "rejected" && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }

  const { error } = await supabaseAdmin
    .from("creator_tasks")
    .update(updateData)
    .eq("id", taskId)

  if (error) {
    console.error("Error updating task status:", error)
    throw new Error(`Failed to update task status: ${error.message}`)
  }
}

// Get tasks for creator
export async function getCreatorTasks(
  tenantId: string,
  creatorId: string,
  status?: string
): Promise<CreatorTask[]> {
  let query = supabaseAdmin
    .from("creator_tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("assigned_to", creatorId)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching creator tasks:", error)
    return []
  }

  return data || []
}

// Record an earning
export async function recordEarning(
  earning: CreatorEarning
): Promise<{ id: string }> {
  // Calculate platform fee if not provided (default 10%)
  const platformFee = earning.platform_fee ?? earning.gross_amount * 0.1
  const netAmount = earning.net_amount ?? earning.gross_amount - platformFee - (earning.tax_amount || 0)

  const { data, error } = await supabaseAdmin
    .from("creator_earnings")
    .insert({
      tenant_id: earning.tenant_id,
      creator_id: earning.creator_id,
      content_id: earning.content_id,
      task_id: earning.task_id,
      earning_type: earning.earning_type,
      description: earning.description,
      gross_amount: earning.gross_amount,
      platform_fee: platformFee,
      tax_amount: earning.tax_amount || 0,
      net_amount: netAmount,
      currency: earning.currency || "USD",
      source_details: earning.source_details || {},
      period_start: earning.period_start,
      period_end: earning.period_end,
      status: "pending",
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error recording earning:", error)
    throw new Error(`Failed to record earning: ${error.message}`)
  }

  return { id: data.id }
}

// Calculate royalties based on rules
export async function calculateRoyalties(
  tenantId: string,
  contentId: string,
  revenue: number,
  views?: number
): Promise<Array<{ creator_id: string; amount: number; rule_applied: string }>> {
  // Get active royalty rules for content
  const { data: rules, error } = await supabaseAdmin
    .from("royalty_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .or(`content_id.eq.${contentId},content_id.is.null`)
    .eq("is_active", true)
    .order("priority", { ascending: false })

  if (error) {
    console.error("Error fetching royalty rules:", error)
    return []
  }

  // Get contributors
  const { data: contributors } = await supabaseAdmin
    .from("video_contributors")
    .select("user_id, contribution_percentage")
    .eq("content_id", contentId)
    .eq("verified", true)

  if (!contributors || contributors.length === 0) {
    return []
  }

  const royalties: Array<{ creator_id: string; amount: number; rule_applied: string }> = []

  for (const rule of rules || []) {
    const config = rule.configuration as RoyaltyRule["configuration"]

    switch (rule.rule_type) {
      case "revenue_share":
        // Distribute revenue based on contribution percentages
        for (const contributor of contributors) {
          const amount = (revenue * (contributor.contribution_percentage / 100) * (config.percentage || 70)) / 100
          royalties.push({
            creator_id: contributor.user_id,
            amount,
            rule_applied: rule.rule_name,
          })
        }
        break

      case "view_based":
        if (views && views >= (config.minimum_views || 0)) {
          for (const contributor of contributors) {
            const amount = views * (config.rate_per_view || 0.001) * (contributor.contribution_percentage / 100)
            royalties.push({
              creator_id: contributor.user_id,
              amount,
              rule_applied: rule.rule_name,
            })
          }
        }
        break

      case "flat_rate":
        for (const contributor of contributors) {
          const amount = (config.flat_amount || 0) * (contributor.contribution_percentage / 100)
          royalties.push({
            creator_id: contributor.user_id,
            amount,
            rule_applied: rule.rule_name,
          })
        }
        break

      case "scene_based":
        // Get scene royalties
        const { data: sceneRoyalties } = await supabaseAdmin
          .from("scene_royalties")
          .select("contributor_id, royalty_percentage")
          .eq("content_id", contentId)

        if (sceneRoyalties) {
          for (const sr of sceneRoyalties) {
            const amount = (revenue * (sr.royalty_percentage / 100) * (config.percentage || 70)) / 100
            royalties.push({
              creator_id: sr.contributor_id,
              amount,
              rule_applied: rule.rule_name,
            })
          }
        }
        break
    }
  }

  return royalties
}

// Process royalty payments for a content
export async function processRoyaltyPayments(
  tenantId: string,
  contentId: string,
  revenue: number,
  views?: number,
  periodStart?: Date,
  periodEnd?: Date
): Promise<{ processed: number; total_amount: number }> {
  const royalties = await calculateRoyalties(tenantId, contentId, revenue, views)

  let totalAmount = 0

  for (const royalty of royalties) {
    await recordEarning({
      tenant_id: tenantId,
      creator_id: royalty.creator_id,
      content_id: contentId,
      earning_type: "royalty",
      description: `Royalty from ${royalty.rule_applied}`,
      gross_amount: royalty.amount,
      net_amount: royalty.amount * 0.9, // 10% platform fee
      period_start: periodStart,
      period_end: periodEnd,
    })
    totalAmount += royalty.amount
  }

  return { processed: royalties.length, total_amount: totalAmount }
}

// Get earnings summary for creator
export async function getEarningsSummary(
  tenantId: string,
  creatorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<EarningsSummary> {
  let query = supabaseAdmin
    .from("creator_earnings")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("creator_id", creatorId)

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString())
  }
  if (endDate) {
    query = query.lte("created_at", endDate.toISOString())
  }

  const { data: earnings, error } = await query

  if (error || !earnings) {
    return {
      total_gross: 0,
      total_platform_fees: 0,
      total_taxes: 0,
      total_net: 0,
      pending_amount: 0,
      paid_amount: 0,
      by_type: {},
      by_content: [],
    }
  }

  const summary: EarningsSummary = {
    total_gross: 0,
    total_platform_fees: 0,
    total_taxes: 0,
    total_net: 0,
    pending_amount: 0,
    paid_amount: 0,
    by_type: {},
    by_content: [],
  }

  const contentMap = new Map<string, number>()

  for (const earning of earnings) {
    summary.total_gross += Number(earning.gross_amount)
    summary.total_platform_fees += Number(earning.platform_fee || 0)
    summary.total_taxes += Number(earning.tax_amount || 0)
    summary.total_net += Number(earning.net_amount)

    if (earning.status === "pending" || earning.status === "confirmed") {
      summary.pending_amount += Number(earning.net_amount)
    } else if (earning.status === "paid") {
      summary.paid_amount += Number(earning.net_amount)
    }

    // Group by type
    if (!summary.by_type[earning.earning_type]) {
      summary.by_type[earning.earning_type] = { gross: 0, net: 0, count: 0 }
    }
    summary.by_type[earning.earning_type].gross += Number(earning.gross_amount)
    summary.by_type[earning.earning_type].net += Number(earning.net_amount)
    summary.by_type[earning.earning_type].count += 1

    // Group by content
    if (earning.content_id) {
      contentMap.set(
        earning.content_id,
        (contentMap.get(earning.content_id) || 0) + Number(earning.net_amount)
      )
    }
  }

  // Get content titles
  for (const [contentId, amount] of contentMap.entries()) {
    summary.by_content.push({
      content_id: contentId,
      title: "", // Would be populated from content table
      amount,
    })
  }

  return summary
}

// Process payout to creator
export async function processPayout(
  tenantId: string,
  creatorId: string,
  earningIds: string[]
): Promise<{ transactionId: string; status: string }> {
  // Get creator profile for payment details
  const profile = await getCreatorProfile(tenantId, creatorId)
  if (!profile) {
    throw new Error("Creator profile not found")
  }

  // Get earnings to pay
  const { data: earnings, error } = await supabaseAdmin
    .from("creator_earnings")
    .select("*")
    .in("id", earningIds)
    .eq("status", "confirmed")

  if (error || !earnings || earnings.length === 0) {
    throw new Error("No confirmed earnings found")
  }

  const totalGross = earnings.reduce((sum, e) => sum + Number(e.gross_amount), 0)
  const totalNet = earnings.reduce((sum, e) => sum + Number(e.net_amount), 0)

  // Check minimum threshold
  if (totalNet < (profile.payout_threshold || 50)) {
    throw new Error(`Amount below minimum threshold of ${profile.payout_threshold || 50}`)
  }

  // Create payment transaction record
  const { data: transaction, error: txError } = await supabaseAdmin
    .from("payment_transactions")
    .insert({
      tenant_id: tenantId,
      creator_id: creatorId,
      earnings_ids: earningIds,
      payment_method: profile.payment_method || "stripe",
      payment_provider: profile.payment_method === "crypto" ? "crypto" : "stripe",
      gross_amount: totalGross,
      fee_amount: totalGross - totalNet,
      net_amount: totalNet,
      currency: profile.preferred_currency || "USD",
      status: "processing",
    })
    .select("id")
    .single()

  if (txError) {
    throw new Error(`Failed to create payment transaction: ${txError.message}`)
  }

  // Process payment via Stripe Connect
  if (profile.stripe_account_id) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(totalNet * 100), // Stripe uses cents
        currency: (profile.preferred_currency || "USD").toLowerCase(),
        destination: profile.stripe_account_id,
        metadata: {
          transaction_id: transaction.id,
          creator_id: creatorId,
          earnings_count: String(earningIds.length),
        },
      })

      // Update transaction status
      await supabaseAdmin
        .from("payment_transactions")
        .update({
          provider_transaction_id: transfer.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      // Update earnings status to paid
      await supabaseAdmin
        .from("creator_earnings")
        .update({ status: "paid" })
        .in("id", earningIds)

      // Log audit event
      await logPaymentAudit(tenantId, transaction.id, "payout_completed", {
        transfer_id: transfer.id,
        amount: totalNet,
      })

      return { transactionId: transaction.id, status: "completed" }
    } catch (stripeError) {
      console.error("Stripe transfer failed:", stripeError)

      await supabaseAdmin
        .from("payment_transactions")
        .update({
          status: "failed",
          failure_reason: stripeError instanceof Error ? stripeError.message : "Unknown error",
        })
        .eq("id", transaction.id)

      throw stripeError
    }
  }

  return { transactionId: transaction.id, status: "processing" }
}

// Log payment audit event
export async function logPaymentAudit(
  tenantId: string,
  transactionId: string | null,
  action: string,
  details?: Record<string, unknown>,
  earningId?: string,
  performedBy?: string
): Promise<void> {
  await supabaseAdmin.from("payment_audit_logs").insert({
    tenant_id: tenantId,
    transaction_id: transactionId,
    earning_id: earningId,
    action,
    performed_by: performedBy,
    details: details || {},
  })
}

// Get payment history for creator
export async function getPaymentHistory(
  tenantId: string,
  creatorId: string,
  limit: number = 20
): Promise<PaymentTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("payment_transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("creator_id", creatorId)
    .order("initiated_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching payment history:", error)
    return []
  }

  return data || []
}

// Create royalty rule
export async function createRoyaltyRule(rule: RoyaltyRule): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin
    .from("royalty_rules")
    .insert({
      tenant_id: rule.tenant_id,
      content_id: rule.content_id,
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      configuration: rule.configuration,
      is_active: rule.is_active ?? true,
      priority: rule.priority || 1,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating royalty rule:", error)
    throw new Error(`Failed to create royalty rule: ${error.message}`)
  }

  return { id: data.id }
}

// Update creator analytics
export async function updateCreatorAnalytics(
  tenantId: string,
  creatorId: string,
  periodType: "daily" | "weekly" | "monthly",
  periodDate: Date,
  metrics: {
    views?: number
    earnings?: number
    royalties?: number
    content_created?: number
    tasks_completed?: number
    avg_rating?: number
    engagement_score?: number
  }
): Promise<void> {
  const { error } = await supabaseAdmin.from("creator_analytics").upsert(
    {
      tenant_id: tenantId,
      creator_id: creatorId,
      period_type: periodType,
      period_date: periodDate.toISOString().split("T")[0],
      total_views: metrics.views || 0,
      total_earnings: metrics.earnings || 0,
      total_royalties: metrics.royalties || 0,
      content_created: metrics.content_created || 0,
      tasks_completed: metrics.tasks_completed || 0,
      avg_content_rating: metrics.avg_rating || 0,
      engagement_score: metrics.engagement_score || 0,
    },
    { onConflict: "creator_id,period_type,period_date" }
  )

  if (error) {
    console.error("Error updating creator analytics:", error)
  }
}
