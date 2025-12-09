# Stripe Webhook Testing Guide

This guide provides detailed instructions for testing Stripe webhook integration.

## Prerequisites

- Stripe CLI installed
- Stripe account (test mode)
- Local development server running

## Setup

### 1. Install Stripe CLI

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

**Windows:**
Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)

### 2. Login to Stripe

```bash
stripe login
```

Follow the prompts to authenticate.

### 3. Start Webhook Forwarding

In a terminal, run:

```bash
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

This will output a webhook signing secret like:
```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

Add this to your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

## Test Scenarios

### 1. Successful Subscription Creation

```bash
stripe trigger customer.subscription.created
```

**Expected Results:**
- Webhook receives event
- Database updated with subscription details
- Status set to "active" or "trialing"
- Tenant tier updated

**Verify in Database:**
```sql
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;
SELECT subscription_tier FROM tenants WHERE id = (
  SELECT tenant_id FROM subscriptions ORDER BY created_at DESC LIMIT 1
);
```

### 2. Subscription Update

```bash
stripe trigger customer.subscription.updated
```

**Expected Results:**
- Webhook processes update
- Subscription period dates updated
- Plan changes reflected

### 3. Payment Success

```bash
stripe trigger invoice.payment_succeeded
```

**Expected Results:**
- Subscription status updated to "active"
- Invoice recorded (if tracking invoices)
- Monitoring logs show success

### 4. Payment Failure

```bash
stripe trigger invoice.payment_failed
```

**Expected Results:**
- Subscription status updated to "past_due"
- Monitoring logs show failure
- User should be notified (if notification system implemented)

### 5. Subscription Cancellation

```bash
stripe trigger customer.subscription.deleted
```

**Expected Results:**
- Subscription status set to "canceled"
- Tenant tier reverted to "free"
- Database reflects cancellation

**Verify:**
```sql
SELECT status, plan_id FROM subscriptions ORDER BY updated_at DESC LIMIT 1;
```

### 6. Checkout Session Completion

```bash
stripe trigger checkout.session.completed
```

**Expected Results:**
- Event logged
- If subscription mode, subscription created

## Manual Testing with UI

### Test Complete Subscription Flow

1. **Start Application:**
   ```bash
   npm run dev
   ```

2. **Start Webhook Forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook
   ```

3. **Navigate to Pricing Page:**
   - Go to `http://localhost:3000/pricing`
   - Ensure you're logged in

4. **Select a Plan:**
   - Choose "Basic" tier
   - Click "Subscribe"
   - Should redirect to Stripe Checkout

5. **Complete Checkout (Test Mode):**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

6. **Verify Success:**
   - Redirected to `/dashboard/subscription?success=true`
   - See success toast
   - Subscription details displayed

7. **Check Database:**
   ```sql
   SELECT s.*, t.subscription_tier 
   FROM subscriptions s
   JOIN tenants t ON s.tenant_id = t.id
   WHERE s.user_id = '<your-user-id>'
   ORDER BY s.created_at DESC LIMIT 1;
   ```

### Test Subscription Management

1. **Navigate to Subscription Dashboard:**
   - Go to `http://localhost:3000/dashboard/subscription`

2. **Test "Manage Billing" Button:**
   - Click "Manage Billing"
   - Should redirect to Stripe Customer Portal
   - Verify portal loads correctly

3. **Test Cancellation:**
   - Click "Cancel Subscription"
   - Confirm cancellation
   - Should show "Canceling" badge
   - Access retained until period end

4. **Test Resume:**
   - After canceling, click "Resume Subscription"
   - Status should return to "Active"
   - "Canceling" badge removed

## Test Card Numbers

Stripe provides various test cards for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0069 | Expired card |
| 4000 0000 0000 0127 | Incorrect CVC |
| 4000 0000 0000 0341 | Attaching fails |

## Webhook Event Verification

### Check Event Processing

```bash
# View webhook events in Stripe CLI
stripe events list --limit 10

# Get specific event
stripe events retrieve evt_xxxxxxxxxxxxx
```

### Verify Event Handling

1. **Check Application Logs:**
   ```bash
   # Your Next.js console should show:
   # "Subscription updated: { subscriptionId: '...', ... }"
   ```

2. **Check Database:**
   ```sql
   -- Verify subscription was created/updated
   SELECT * FROM subscriptions WHERE stripe_subscription_id = 'sub_xxxxx';
   
   -- Check subscription history
   SELECT * FROM subscription_history ORDER BY created_at DESC LIMIT 5;
   ```

3. **Check Monitoring:**
   - Review logs in your monitoring tool
   - Verify events are tracked in `analytics_events` table

## Common Issues

### Issue: Webhook signature verification fails

**Solution:**
- Ensure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI
- If using deployed environment, use webhook secret from Stripe Dashboard

### Issue: User not found in database

**Solution:**
- Ensure user is authenticated before accessing subscription pages
- Check that user was properly created during sign-up

### Issue: Subscription not updating in database

**Solution:**
- Check webhook event reaches your endpoint
- Verify database connection is working
- Check for errors in application logs

### Issue: Redirect after checkout fails

**Solution:**
- Verify `successUrl` and `cancelUrl` are properly set
- Check that URLs are accessible
- Ensure session parameter handling works

## Automated Testing Script

Create a test script `scripts/test-webhooks.sh`:

```bash
#!/bin/bash

echo "Testing Stripe Webhooks..."

echo "\n1. Testing subscription creation..."
stripe trigger customer.subscription.created

sleep 2

echo "\n2. Testing payment success..."
stripe trigger invoice.payment_succeeded

sleep 2

echo "\n3. Testing subscription update..."
stripe trigger customer.subscription.updated

sleep 2

echo "\n4. Testing payment failure..."
stripe trigger invoice.payment_failed

sleep 2

echo "\n5. Testing subscription deletion..."
stripe trigger customer.subscription.deleted

echo "\nAll webhook tests completed!"
```

Run with:
```bash
chmod +x scripts/test-webhooks.sh
./scripts/test-webhooks.sh
```

## Production Webhook Testing

When testing in production:

1. **Use Stripe Dashboard Webhooks:**
   - Create webhook endpoint in Dashboard
   - Use production webhook secret
   - Monitor events in Dashboard

2. **Test with Real Cards:**
   - Use actual card for testing
   - Immediately refund test charges
   - Document test transactions

3. **Verify with Small Amounts:**
   - Test with $0.50 charges
   - Refund immediately after verification

## Monitoring Webhooks

### Real-time Monitoring

```bash
# Watch webhook events
stripe events tail

# Filter specific events
stripe events tail --filter type=customer.subscription.updated
```

### Dashboard Monitoring

1. Go to Stripe Dashboard > Developers > Webhooks
2. Select your webhook endpoint
3. View recent deliveries and their status
4. Retry failed webhooks if needed

## Best Practices

1. **Always verify webhook signatures**
2. **Handle idempotency** - webhooks may be sent multiple times
3. **Return 200 status quickly** - process asynchronously if needed
4. **Log all webhook events** for debugging
5. **Monitor failed webhooks** and set up alerts
6. **Test all event types** before going to production

## Resources

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
