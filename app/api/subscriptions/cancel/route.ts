/**
 * API Route: Cancel Subscription
 * Handles canceling an active subscription
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cancelSubscription, resumeSubscription } from '@/lib/stripe'
import { query } from '@/lib/db'
import { logError, logInfo } from '@/lib/monitoring'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action = 'cancel' } = body // 'cancel' or 'resume'

    // Get user from database
    const userResult = await query(
      `SELECT id FROM users WHERE email = $1`,
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Get active subscription
    const subscriptionResult = await query(
      `SELECT stripe_subscription_id, status FROM subscriptions 
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due')
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )

    if (subscriptionResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const { stripe_subscription_id } = subscriptionResult.rows[0]

    let updatedSubscription
    if (action === 'resume') {
      // Resume subscription
      updatedSubscription = await resumeSubscription(stripe_subscription_id)
      await logInfo('Subscription resumed', { userId, subscriptionId: stripe_subscription_id })
    } else {
      // Cancel subscription at period end
      updatedSubscription = await cancelSubscription(stripe_subscription_id, true)
      await logInfo('Subscription canceled', { userId, subscriptionId: stripe_subscription_id })
    }

    // Update database
    await query(
      `UPDATE subscriptions 
       SET status = $1, updated_at = NOW()
       WHERE stripe_subscription_id = $2`,
      [updatedSubscription.status, stripe_subscription_id]
    )

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: updatedSubscription.current_period_end,
      },
    })
  } catch (error) {
    await logError('Failed to cancel subscription', error as Error)
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
