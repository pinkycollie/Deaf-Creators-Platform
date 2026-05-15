/**
 * Subscription Management Component
 * Displays current subscription and allows users to manage their plan
 */

'use client'

import { useEffect, useState } from 'react'
import { Calendar, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Subscription {
  tier: {
    id: string
    name: string
    description: string
    features: Array<{ name: string; included: boolean }>
  }
  status: string
  subscription: {
    id: string
    status: string
    cancelAtPeriodEnd: boolean
    currentPeriodStart: number
    currentPeriodEnd: number
    priceId: string
  } | null
}

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/status')
      if (!response.ok) throw new Error('Failed to fetch subscription')
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('Failed to load subscription information')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      if (!response.ok) throw new Error('Failed to create portal session')

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (!response.ok) throw new Error('Failed to cancel subscription')

      toast.success('Subscription canceled successfully')
      fetchSubscription()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResumeSubscription = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })

      if (!response.ok) throw new Error('Failed to resume subscription')

      toast.success('Subscription resumed successfully')
      fetchSubscription()
    } catch (error) {
      console.error('Error resuming subscription:', error)
      toast.error('Failed to resume subscription')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No subscription information available.</p>
      </Card>
    )
  }

  const { tier, status, subscription: sub } = subscription
  const isCanceling = sub?.cancelAtPeriodEnd || false
  const isActive = status === 'active' || status === 'trialing'
  const isPastDue = status === 'past_due'

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold">{tier.name} Plan</h3>
              <Badge variant={isActive ? 'default' : isPastDue ? 'destructive' : 'secondary'}>
                {isCanceling ? 'Canceling' : status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{tier.description}</p>
          </div>
          <CreditCard className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Subscription Details */}
        {sub && (
          <div className="mt-6 space-y-3">
            {isPastDue && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Payment Failed</p>
                  <p className="text-muted-foreground mt-1">
                    Your payment method was declined. Please update your payment information to continue your subscription.
                  </p>
                </div>
              </div>
            )}

            {isCanceling && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600">Subscription Canceling</p>
                  <p className="text-muted-foreground mt-1">
                    Your subscription is set to cancel at the end of the billing period. You can resume it anytime before then.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Current period:</span>
              <span className="font-medium">
                {format(new Date(sub.currentPeriodStart * 1000), 'MMM d, yyyy')} -{' '}
                {format(new Date(sub.currentPeriodEnd * 1000), 'MMM d, yyyy')}
              </span>
            </div>

            {isCanceling && (
              <div className="text-sm">
                <span className="text-muted-foreground">Access until:</span>
                <span className="font-medium ml-2">
                  {format(new Date(sub.currentPeriodEnd * 1000), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Your plan includes:</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tier.features
              .filter((f) => f.included)
              .map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {feature.name}
                </li>
              ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleManageBilling} disabled={actionLoading || tier.id === 'free'}>
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Manage Billing'
            )}
          </Button>

          {isActive && !isCanceling && tier.id !== 'free' && (
            <Button
              onClick={handleCancelSubscription}
              variant="outline"
              disabled={actionLoading}
            >
              Cancel Subscription
            </Button>
          )}

          {isCanceling && (
            <Button
              onClick={handleResumeSubscription}
              variant="default"
              disabled={actionLoading}
            >
              Resume Subscription
            </Button>
          )}
        </div>
      </Card>

      {/* Upgrade/Downgrade Card */}
      {tier.id !== 'premium' && (
        <Card className="p-6">
          <h4 className="font-medium mb-2">Want more features?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade your plan to unlock additional features and increase your limits.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        </Card>
      )}
    </div>
  )
}
