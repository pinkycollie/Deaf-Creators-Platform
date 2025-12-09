/**
 * API Route: Create Customer Portal Session
 * Creates a Stripe customer portal session for subscription management
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
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
    const { returnUrl } = body

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing required field: returnUrl' },
        { status: 400 }
      )
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

    // Get Stripe customer ID
    const subscriptionResult = await query(
      `SELECT stripe_customer_id FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    )

    if (subscriptionResult.rows.length === 0 || !subscriptionResult.rows[0].stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 404 }
      )
    }

    const { stripe_customer_id } = subscriptionResult.rows[0]

    // Create portal session
    const portalSession = await createPortalSession({
      customerId: stripe_customer_id,
      returnUrl,
    })

    await logInfo('Customer portal session created', {
      userId,
      customerId: stripe_customer_id,
    })

    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    await logError('Failed to create portal session', error as Error)
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
