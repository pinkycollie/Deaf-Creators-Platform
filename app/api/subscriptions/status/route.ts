/**
 * API Route: Get Subscription Status
 * Returns the current subscription status for the authenticated user
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSubscription } from '@/lib/stripe'
import { query } from '@/lib/db'
import { getSubscriptionTier } from '@/lib/subscription-tiers'
import { logError } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const userResult = await query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Get subscription from database
    const subscriptionResult = await query(
      `SELECT 
        stripe_subscription_id, 
        stripe_customer_id,
        plan_id, 
        status, 
        current_period_start, 
        current_period_end,
        created_at,
        updated_at
       FROM subscriptions 
       WHERE user_id = $1
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    )

    if (subscriptionResult.rows.length === 0) {
      // No subscription found, return free tier
      const freeTier = getSubscriptionTier('free')
      return NextResponse.json({
        tier: freeTier,
        status: 'free',
        subscription: null,
      })
    }

    const dbSubscription = subscriptionResult.rows[0]

    // If there's a Stripe subscription ID, get fresh data from Stripe
    let stripeSubscription = null
    if (dbSubscription.stripe_subscription_id) {
      stripeSubscription = await getSubscription(dbSubscription.stripe_subscription_id)
    }

    // Get tier information
    const tier = getSubscriptionTier(dbSubscription.plan_id) || getSubscriptionTier('free')

    return NextResponse.json({
      tier,
      status: dbSubscription.status,
      subscription: stripeSubscription
        ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            currentPeriodStart: stripeSubscription.current_period_start,
            currentPeriodEnd: stripeSubscription.current_period_end,
            priceId: stripeSubscription.items.data[0]?.price.id,
          }
        : {
            status: dbSubscription.status,
            currentPeriodStart: dbSubscription.current_period_start,
            currentPeriodEnd: dbSubscription.current_period_end,
          },
    })
  } catch (error) {
    await logError('Failed to get subscription status', error as Error)
    console.error('Error getting subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}
