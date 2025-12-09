/**
 * API Route: Create Subscription
 * Handles creating a new Stripe checkout session for subscription
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession, createStripeCustomer, getCustomer } from '@/lib/stripe'
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
    const { priceId, successUrl, cancelUrl } = body

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, successUrl, cancelUrl' },
        { status: 400 }
      )
    }

    // Get user from database
    const userResult = await query<any>(
      `SELECT id, tenant_id, email, full_name FROM users WHERE email = $1`,
      [session.user.email]
    )

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]

    // Check if user already has a Stripe customer ID
    let stripeCustomerId: string
    const subscriptionResult = await query<any>(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    )

    if (subscriptionResult.length > 0 && subscriptionResult[0].stripe_customer_id) {
      // Use existing customer ID
      stripeCustomerId = subscriptionResult[0].stripe_customer_id

      // Verify customer still exists in Stripe
      const customer = await getCustomer(stripeCustomerId)
      if (!customer) {
        // Create new customer if old one doesn't exist
        const newCustomer = await createStripeCustomer({
          email: user.email,
          name: user.full_name,
          metadata: {
            userId: user.id,
            tenantId: user.tenant_id,
          },
        })
        stripeCustomerId = newCustomer.id
      }
    } else {
      // Create new Stripe customer
      const customer = await createStripeCustomer({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: user.id,
          tenantId: user.tenant_id,
        },
      })
      stripeCustomerId = customer.id

      // Update database with customer ID
      await query(
        `INSERT INTO subscriptions (user_id, tenant_id, stripe_customer_id, plan_id, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = $3`,
        [user.id, user.tenant_id, stripeCustomerId, 'free', 'inactive']
      )
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      successUrl,
      cancelUrl,
      metadata: {
        userId: user.id,
        tenantId: user.tenant_id,
      },
    })

    await logInfo('Subscription checkout session created', {
      userId: user.id,
      sessionId: checkoutSession.id,
      priceId,
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    })
  } catch (error) {
    await logError('Failed to create subscription checkout', error as Error)
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
