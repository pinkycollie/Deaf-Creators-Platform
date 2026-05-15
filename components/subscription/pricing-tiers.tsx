/**
 * Pricing Tiers Component
 * Displays subscription tiers with pricing and features
 */

'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ALL_TIERS, type SubscriptionTier } from '@/lib/subscription-tiers'
import { toast } from 'sonner'

interface PricingTiersProps {
  currentTier?: string
  onSelectPlan?: (tier: SubscriptionTier, interval: 'monthly' | 'yearly') => Promise<void>
}

export function PricingTiers({ currentTier = 'free', onSelectPlan }: PricingTiersProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (!onSelectPlan || tier.id === 'free') return

    setLoading(tier.id)
    try {
      await onSelectPlan(tier, billingInterval)
    } catch (error) {
      console.error('Error selecting plan:', error)
      toast.error('Failed to select plan. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (tier: SubscriptionTier) => {
    return billingInterval === 'monthly' ? tier.price.monthly : tier.price.yearly
  }

  const getPriceId = (tier: SubscriptionTier) => {
    if (!tier.stripePriceIds) return ''
    return billingInterval === 'monthly'
      ? tier.stripePriceIds.monthly
      : tier.stripePriceIds.yearly
  }

  // Calculate average savings percentage across paid tiers
  const calculateSavings = () => {
    const paidTiers = ALL_TIERS.filter(t => t.price.monthly > 0)
    if (paidTiers.length === 0) return 0
    
    const avgSavings = paidTiers.reduce((sum, tier) => {
      const monthlyTotal = tier.price.monthly * 12
      const yearlySavings = ((monthlyTotal - tier.price.yearly) / monthlyTotal) * 100
      return sum + yearlySavings
    }, 0) / paidTiers.length
    
    return Math.round(avgSavings)
  }

  const savingsPercent = calculateSavings()

  return (
    <div className="w-full space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center items-center gap-4">
        <span
          className={`text-sm font-medium ${
            billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          role="switch"
          aria-checked={billingInterval === 'yearly'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
              billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${
            billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Yearly {savingsPercent > 0 && (
            <Badge className="ml-1" variant="secondary">Save {savingsPercent}%</Badge>
          )}
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ALL_TIERS.map((tier) => {
          const price = getPrice(tier)
          const isCurrentTier = currentTier === tier.id
          const isPopular = tier.popular

          return (
            <Card
              key={tier.id}
              className={`relative p-6 flex flex-col ${
                isPopular ? 'border-primary shadow-lg' : ''
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                  Most Popular
                </Badge>
              )}

              {isCurrentTier && (
                <Badge className="absolute -top-3 right-4" variant="secondary">
                  Current Plan
                </Badge>
              )}

              <div className="space-y-4 flex-1">
                {/* Header */}
                <div>
                  <h3 className="text-2xl font-bold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">
                      /{billingInterval === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingInterval === 'yearly' && price > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${(price / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 ${
                          feature.included ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground line-through'
                        }`}
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleSelectPlan(tier)}
                disabled={isCurrentTier || loading !== null || tier.id === 'free'}
                className="w-full mt-6"
                variant={isPopular ? 'default' : 'outline'}
              >
                {loading === tier.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentTier ? (
                  'Current Plan'
                ) : tier.id === 'free' ? (
                  'Free Plan'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include ASL caption support for accessibility.</p>
        <p className="mt-2">
          Need a custom plan?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
