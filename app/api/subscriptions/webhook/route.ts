/**
 * API Route: Stripe Webhook Handler
 * Handles Stripe webhook events for subscription management
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { constructWebhookEvent, getTierFromSubscription } from "@/lib/stripe"
import { query } from "@/lib/db"
import { logError, logInfo } from "@/lib/monitoring"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    await logError("Webhook signature verification failed", error as Error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === "subscription" && session.subscription) {
          await logInfo("Checkout session completed", {
            sessionId: session.id,
            customerId: session.customer,
            subscriptionId: session.subscription,
          })
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0]?.price.id

        // Get tier information
        const tierInfo = getTierFromSubscription(subscription)
        const planId = tierInfo?.tierId || "free"

        // Find user by Stripe customer ID
        const userResult = await query<any>(
          `SELECT user_id, tenant_id FROM subscriptions WHERE stripe_customer_id = $1 LIMIT 1`,
          [customerId]
        )

        if (userResult.length > 0) {
          const { user_id, tenant_id } = userResult[0]

          // Update subscription in database
          await query(
            `INSERT INTO subscriptions (
              user_id, 
              tenant_id, 
              stripe_subscription_id, 
              stripe_customer_id,
              plan_id, 
              status, 
              current_period_start, 
              current_period_end,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
              stripe_subscription_id = $3,
              stripe_customer_id = $4,
              plan_id = $5,
              status = $6,
              current_period_start = $7,
              current_period_end = $8,
              updated_at = NOW()`,
            [
              user_id,
              tenant_id,
              subscription.id,
              customerId,
              planId,
              subscription.status,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000),
            ]
          )

          // Update tenant subscription tier
          await query(
            `UPDATE tenants SET 
              subscription_tier = $1,
              subscription_status = $2,
              updated_at = NOW()
             WHERE id = $3`,
            [planId, subscription.status, tenant_id]
          )

          await logInfo("Subscription updated", {
            subscriptionId: subscription.id,
            userId: user_id,
            planId,
            status: subscription.status,
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status to canceled
        await query(
          `UPDATE subscriptions 
           SET status = $1, plan_id = $2, updated_at = NOW()
           WHERE stripe_subscription_id = $3`,
          ["canceled", "free", subscription.id]
        )

        // Update tenant to free tier
        const tenantResult = await query<any>(
          `SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = $1`,
          [subscription.id]
        )

        if (tenantResult.length > 0) {
          await query(
            `UPDATE tenants SET 
              subscription_tier = $1,
              subscription_status = $2,
              updated_at = NOW()
             WHERE id = $3`,
            ["free", "canceled", tenantResult[0].tenant_id]
          )
        }

        await logInfo("Subscription deleted", {
          subscriptionId: subscription.id,
        })
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await query(
            `UPDATE subscriptions 
             SET status = $1, updated_at = NOW()
             WHERE stripe_subscription_id = $2`,
            ["active", invoice.subscription as string]
          )

          await logInfo("Invoice payment succeeded", {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          await query(
            `UPDATE subscriptions 
             SET status = $1, updated_at = NOW()
             WHERE stripe_subscription_id = $2`,
            ["past_due", invoice.subscription as string]
          )

          await logInfo("Invoice payment failed", {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
          })
        }
        break
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription
        
        await logInfo("Subscription trial ending soon", {
          subscriptionId: subscription.id,
          trialEnd: subscription.trial_end,
        })
        // TODO: Send notification email to user
        break
      }

      default:
        await logInfo("Unhandled webhook event", { type: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    await logError("Webhook processing failed", error as Error)
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
