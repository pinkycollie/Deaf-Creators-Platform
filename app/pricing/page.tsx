/**
 * Pricing Page
 * Displays subscription tiers and handles plan selection
 */

'use client'

import { useRouter } from 'next/navigation'
import { PricingTiers } from '@/components/subscription/pricing-tiers'
import { toast } from 'sonner'
import type { SubscriptionTier } from '@/lib/subscription-tiers'

export default function PricingPage() {
  const router = useRouter()

  const handleSelectPlan = async (tier: SubscriptionTier, interval: 'monthly' | 'yearly') => {
    const priceId = interval === 'monthly' ? tier.stripePriceIds.monthly : tier.stripePriceIds.yearly

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful features for your Deaf creator platform. All plans include accessibility features and ASL support.
          </p>
        </div>

        {/* Pricing Tiers */}
        <PricingTiers onSelectPlan={handleSelectPlan} />

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Can I change my plan later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, debit cards, and other payment methods supported by Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Can I cancel my subscription?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll retain access to your paid features until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day money-back guarantee for all paid plans. Contact support for refund requests.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Are all features accessible?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely! We're committed to WCAG 2.1 AA compliance. All features include ASL caption support, keyboard navigation, and screen reader compatibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
