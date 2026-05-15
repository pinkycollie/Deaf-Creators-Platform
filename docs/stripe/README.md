# Stripe Subscription Integration

This document describes the Stripe subscription integration for the Deaf Creator Platform with tiered pricing.

## Overview

The platform uses Stripe for subscription management with three paid tiers (Basic, Standard, Premium) plus a free tier. All plans include accessibility features and ASL caption support.

## Architecture

### Components

1. **Subscription Tiers** (`lib/subscription-tiers.ts`)
   - Defines tier configurations
   - Includes pricing, features, and limits
   - Environment-based Stripe price IDs

2. **Stripe Utilities** (`lib/stripe.ts`)
   - Stripe API wrapper functions
   - Customer management
   - Checkout session creation
   - Webhook verification

3. **API Routes** (`app/api/subscriptions/`)
   - `/create` - Create checkout session
   - `/cancel` - Cancel/resume subscription
   - `/status` - Get subscription status
   - `/portal` - Customer portal access
   - `/webhook` - Handle Stripe webhooks

4. **UI Components** (`components/subscription/`)
   - `pricing-tiers.tsx` - Display pricing plans
   - `subscription-management.tsx` - Manage active subscription

5. **Pages**
   - `/pricing` - Public pricing page
   - `/dashboard/subscription` - Subscription management

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_...
STRIPE_BASIC_YEARLY_PRICE_ID=price_...
STRIPE_STANDARD_MONTHLY_PRICE_ID=price_...
STRIPE_STANDARD_YEARLY_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
```

### 2. Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Products > Add Product
3. Create three products:
   - **Basic**: $9.99/month or $99.99/year
   - **Standard**: $24.99/month or $249.99/year
   - **Premium**: $49.99/month or $499.99/year
4. Copy the price IDs and add them to your `.env.local`

### 3. Set Up Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/subscriptions/webhook`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret and add to `.env.local`

### 4. Run Database Migration

Execute the subscription enhancement migration:

```bash
psql $DATABASE_URL -f scripts/006-subscription-enhancements.sql
```

This creates:
- `subscription_tiers` table
- `subscription_history` table
- Helper functions for limit checking
- Necessary indexes and RLS policies

### 5. Configure Customer Portal

1. In Stripe Dashboard, go to Settings > Billing > Customer Portal
2. Enable the portal
3. Configure allowed actions:
   - Update payment method
   - Update billing information
   - Cancel subscription
   - View invoices
4. Set up cancellation behavior (retain access until end of period)

## Usage

### For Users

#### Subscribe to a Plan

1. Navigate to `/pricing`
2. Select billing interval (monthly/yearly)
3. Click "Subscribe" on desired tier
4. Complete Stripe checkout
5. Redirected to `/dashboard/subscription` on success

#### Manage Subscription

1. Go to `/dashboard/subscription`
2. View current plan and features
3. Click "Manage Billing" to:
   - Update payment method
   - Change plan
   - View invoices
   - Cancel subscription
4. Click "Cancel Subscription" to cancel (retains access until period end)
5. Click "Resume Subscription" to reactivate a canceling subscription

### For Developers

#### Check Subscription Limits

Use the database function:

```sql
SELECT check_subscription_limit(user_id, 'projects', current_project_count);
-- Returns true if within limit, false otherwise
```

#### Get User's Subscription Tier

```typescript
import { getSubscriptionTier } from '@/lib/subscription-tiers'

const tier = getSubscriptionTier('basic')
console.log(tier.maxProjects) // 5
console.log(tier.maxStorage) // 10 (GB)
```

#### Check Feature Availability

```typescript
import { isFeatureAvailable } from '@/lib/subscription-tiers'

const hasAdvancedAnalytics = isFeatureAvailable('basic', 'Advanced analytics')
// Returns false for basic tier
```

## Webhook Events

### `checkout.session.completed`
Fired when user completes checkout. Logs the event for tracking.

### `customer.subscription.created/updated`
Updates subscription in database with:
- Status
- Current period dates
- Plan ID
- Updates tenant subscription tier

### `customer.subscription.deleted`
Sets subscription status to "canceled" and reverts tenant to free tier.

### `invoice.payment_succeeded`
Updates subscription status to "active".

### `invoice.payment_failed`
Updates subscription status to "past_due". User should update payment method.

### `customer.subscription.trial_will_end`
Logs event. Can be extended to send notification emails.

## Testing Webhooks

### Using Stripe CLI

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to local: `stripe listen --forward-to localhost:3000/api/subscriptions/webhook`
4. Use provided webhook secret in `.env.local`
5. Trigger test events: `stripe trigger customer.subscription.created`

### Manual Testing

1. Use Stripe test mode keys
2. Test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC
5. Any ZIP code

See [Testing Guide](./TESTING.md) for comprehensive test scenarios.

## Security Considerations

1. **Webhook Verification**: All webhooks verify signature before processing
2. **Authentication**: All API routes require authentication via NextAuth
3. **Environment Variables**: Never commit Stripe keys to version control
4. **RLS Policies**: Database uses Row Level Security for tenant isolation
5. **Monitoring**: All operations logged via `lib/monitoring.ts`

## Accessibility Features

All subscription features maintain WCAG 2.1 AA compliance:

- Keyboard navigation supported throughout
- Screen reader compatible
- ASL caption support included in all tiers
- High contrast UI elements
- Focus indicators on interactive elements

## Support

For issues or questions:
1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review [API Documentation](./API.md)
3. Contact support team

## Related Documentation

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Webhook Testing Guide](./TESTING.md)
- [Subscription Limits](./LIMITS.md)
- [Migration Guide](./MIGRATION.md)
