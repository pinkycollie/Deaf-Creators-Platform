/**
 * Subscription Dashboard Page
 * Allows users to manage their subscription
 */

'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SubscriptionManagement } from '@/components/subscription/subscription-management'
import { toast } from 'sonner'

export default function SubscriptionPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle success/cancel params from Stripe redirect
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Subscription activated successfully!')
    } else if (canceled === 'true') {
      toast.info('Subscription process was canceled.')
    }
  }, [searchParams])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing information.
          </p>
        </div>

        <SubscriptionManagement />
      </div>
    </div>
  )
}
