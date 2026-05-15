/**
 * Stripe Integration Utilities
 * Provides helper functions for Stripe operations
 */

import Stripe from 'stripe'
import { getSubscriptionTier } from './subscription-tiers'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

/**
 * Create a new Stripe customer
 */
export async function createStripeCustomer(params: {
  email: string
  name?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  })
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.create({
    customer: params.customerId,
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })
}

/**
 * Create a customer portal session
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return null
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  })
}

/**
 * Resume a subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Update subscription to a new plan
 */
export async function updateSubscriptionPlan(params: {
  subscriptionId: string
  newPriceId: string
}): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)
  
  return await stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer as Stripe.Customer
  } catch (error) {
    console.error('Error retrieving customer:', error)
    return null
  }
}

/**
 * Get customer's subscriptions
 */
export async function getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  })
  return subscriptions.data
}

/**
 * Construct webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    constructWebhookEvent(payload, signature, webhookSecret)
    return true
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

/**
 * Get subscription status from Stripe subscription
 */
export function getSubscriptionStatus(subscription: Stripe.Subscription): string {
  if (subscription.status === 'active') {
    if (subscription.cancel_at_period_end) {
      return 'canceling'
    }
    return 'active'
  }
  return subscription.status
}

/**
 * Format currency amount from Stripe (cents to dollars)
 */
export function formatAmount(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/**
 * Get tier information from subscription
 */
export function getTierFromSubscription(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) return null

  // Find tier by price ID
  const tiers = ['basic', 'standard', 'premium']
  for (const tierId of tiers) {
    const tier = getSubscriptionTier(tierId)
    if (
      tier &&
      (tier.stripePriceIds.monthly === priceId || tier.stripePriceIds.yearly === priceId)
    ) {
      return {
        tierId: tier.id,
        tierName: tier.name,
        interval: tier.stripePriceIds.monthly === priceId ? 'monthly' : 'yearly',
      }
    }
  }

  return null
}
