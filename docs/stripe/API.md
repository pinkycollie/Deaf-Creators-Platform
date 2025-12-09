# Subscription API Documentation

This document details the subscription management API endpoints.

## Base URL

All endpoints are prefixed with `/api/subscriptions`

## Authentication

All endpoints (except webhook) require authentication via NextAuth session. Include session cookie in requests.

## Endpoints

### POST /api/subscriptions/create

Create a new subscription checkout session.

**Authentication**: Required

**Request Body**:
```json
{
  "priceId": "price_xxxxxxxxxxxxx",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel"
}
```

**Parameters**:
- `priceId` (string, required): Stripe price ID for the subscription
- `successUrl` (string, required): URL to redirect after successful payment
- `cancelUrl` (string, required): URL to redirect if user cancels

**Response** (200 OK):
```json
{
  "sessionId": "cs_test_xxxxxxxxxxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxxxxxxxxxx"
}
```

**Errors**:
- `401`: Unauthorized - User not authenticated
- `404`: User not found in database
- `400`: Missing required fields
- `500`: Server error

**Example**:
```typescript
const response = await fetch('/api/subscriptions/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_1234567890',
    successUrl: window.location.origin + '/dashboard/subscription?success=true',
    cancelUrl: window.location.origin + '/pricing?canceled=true',
  }),
})

const { url } = await response.json()
window.location.href = url
```

---

### GET /api/subscriptions/status

Get the current subscription status for authenticated user.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "tier": {
    "id": "basic",
    "name": "Basic",
    "description": "Perfect for individual creators",
    "features": [
      { "name": "Up to 5 projects", "included": true },
      { "name": "10 GB storage", "included": true }
    ]
  },
  "status": "active",
  "subscription": {
    "id": "sub_xxxxxxxxxxxxx",
    "status": "active",
    "cancelAtPeriodEnd": false,
    "currentPeriodStart": 1234567890,
    "currentPeriodEnd": 1234567890,
    "priceId": "price_xxxxxxxxxxxxx"
  }
}
```

**Errors**:
- `401`: Unauthorized - User not authenticated
- `404`: User not found in database
- `500`: Server error

**Example**:
```typescript
const response = await fetch('/api/subscriptions/status')
const { tier, status, subscription } = await response.json()

console.log(`Current tier: ${tier.name}`)
console.log(`Status: ${status}`)
```

---

### POST /api/subscriptions/cancel

Cancel or resume a subscription.

**Authentication**: Required

**Request Body**:
```json
{
  "action": "cancel" | "resume"
}
```

**Parameters**:
- `action` (string, optional): "cancel" or "resume". Default: "cancel"

**Response** (200 OK):
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxxxxxxxxxxxx",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": 1234567890
  }
}
```

**Errors**:
- `401`: Unauthorized - User not authenticated
- `404`: User or subscription not found
- `500`: Server error

**Example - Cancel**:
```typescript
const response = await fetch('/api/subscriptions/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'cancel' }),
})

const { subscription } = await response.json()
console.log(`Subscription will cancel on: ${new Date(subscription.currentPeriodEnd * 1000)}`)
```

**Example - Resume**:
```typescript
const response = await fetch('/api/subscriptions/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'resume' }),
})

const { subscription } = await response.json()
console.log(`Subscription resumed: ${subscription.status}`)
```

---

### POST /api/subscriptions/portal

Create a Stripe customer portal session for subscription management.

**Authentication**: Required

**Request Body**:
```json
{
  "returnUrl": "https://yoursite.com/dashboard"
}
```

**Parameters**:
- `returnUrl` (string, required): URL to return to after managing subscription

**Response** (200 OK):
```json
{
  "url": "https://billing.stripe.com/session/xxxxxxxxxxxxx"
}
```

**Errors**:
- `401`: Unauthorized - User not authenticated
- `404`: User or subscription not found
- `400`: Missing returnUrl
- `500`: Server error

**Example**:
```typescript
const response = await fetch('/api/subscriptions/portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    returnUrl: window.location.href,
  }),
})

const { url } = await response.json()
window.location.href = url
```

---

### POST /api/subscriptions/webhook

Stripe webhook endpoint for subscription events.

**Authentication**: None (verified via Stripe signature)

**Headers**:
- `stripe-signature`: Stripe webhook signature (automatically added by Stripe)

**Request Body**: Raw Stripe webhook event

**Response** (200 OK):
```json
{
  "received": true
}
```

**Errors**:
- `400`: Invalid signature
- `500`: Processing error

**Supported Events**:
- `checkout.session.completed`: Checkout completed
- `customer.subscription.created`: New subscription
- `customer.subscription.updated`: Subscription changed
- `customer.subscription.deleted`: Subscription canceled
- `invoice.payment_succeeded`: Payment successful
- `invoice.payment_failed`: Payment failed
- `customer.subscription.trial_will_end`: Trial ending soon

**Note**: This endpoint should be configured in Stripe Dashboard, not called directly.

---

## Rate Limiting

All API endpoints are subject to rate limiting:
- 10 requests per minute per user for create/cancel/portal
- 30 requests per minute for status endpoint
- No rate limit on webhook (handled by Stripe)

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (not authenticated)
- `404`: Not found (resource doesn't exist)
- `500`: Internal server error

## Subscription Status Values

Possible subscription status values:
- `active`: Subscription is active
- `trialing`: In trial period
- `past_due`: Payment failed, awaiting retry
- `canceled`: Subscription canceled
- `incomplete`: Payment incomplete
- `incomplete_expired`: Payment timed out
- `unpaid`: Payment failed permanently
- `free`: No paid subscription (free tier)

## Testing

See [TESTING.md](./TESTING.md) for webhook testing instructions.

For API testing, use test mode Stripe keys and test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`

## Best Practices

1. **Always handle errors**: API calls can fail, implement proper error handling
2. **Show loading states**: Checkout creation can take a few seconds
3. **Verify success**: Check subscription status after redirect
4. **Test webhooks**: Use Stripe CLI for local webhook testing
5. **Monitor logs**: Check application logs for webhook processing

## Integration Example

Complete subscription flow:

```typescript
// 1. Create checkout session
async function subscribe(priceId: string) {
  try {
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    })
    
    if (!response.ok) throw new Error('Failed to create checkout')
    
    const { url } = await response.json()
    window.location.href = url
  } catch (error) {
    console.error('Subscription error:', error)
    alert('Failed to start subscription process')
  }
}

// 2. Check subscription status
async function checkSubscription() {
  const response = await fetch('/api/subscriptions/status')
  const { tier, status, subscription } = await response.json()
  
  return { tier, status, subscription }
}

// 3. Cancel subscription
async function cancelSubscription() {
  if (!confirm('Are you sure you want to cancel?')) return
  
  const response = await fetch('/api/subscriptions/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel' }),
  })
  
  if (response.ok) {
    alert('Subscription will be canceled at period end')
  }
}

// 4. Open customer portal
async function manageSubscription() {
  const response = await fetch('/api/subscriptions/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      returnUrl: window.location.href,
    }),
  })
  
  const { url } = await response.json()
  window.location.href = url
}
```

## Support

For API issues:
1. Check response status and error message
2. Verify authentication is working
3. Check Stripe Dashboard for webhook logs
4. Review application logs
5. Contact support with request ID
