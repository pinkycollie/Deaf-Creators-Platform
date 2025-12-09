/**
 * Subscription Tier Configuration
 * Defines the pricing tiers and their features for the platform
 */

export interface SubscriptionFeature {
  name: string
  description: string
  included: boolean
  limit?: number | string
}

export interface SubscriptionTier {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  stripePriceIds: {
    monthly: string
    yearly: string
  }
  features: SubscriptionFeature[]
  popular?: boolean
  maxProjects?: number
  maxStorage?: number // in GB
  maxVideoDuration?: number // in minutes
  priority?: number
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for individual creators getting started',
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_basic_monthly',
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || 'price_basic_yearly',
    },
    features: [
      { name: 'Up to 5 projects', description: 'Create up to 5 projects', included: true },
      { name: '10 GB storage', description: 'Store up to 10GB of content', included: true },
      { name: 'Video duration up to 30 minutes', description: 'Upload videos up to 30 minutes', included: true },
      { name: 'Standard video processing', description: 'Process videos with standard quality', included: true },
      { name: 'Basic analytics', description: 'View basic analytics and insights', included: true },
      { name: 'Community support', description: 'Get help from the community', included: true },
      { name: 'ASL caption support', description: 'Automatic ASL captions for accessibility', included: true },
      { name: 'Priority support', description: '24/7 priority support', included: false },
      { name: 'Advanced analytics', description: 'Detailed analytics and insights', included: false },
    ],
    maxProjects: 5,
    maxStorage: 10,
    maxVideoDuration: 30,
    priority: 1,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'For growing creators with more content',
    price: {
      monthly: 24.99,
      yearly: 249.99,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID || 'price_standard_monthly',
      yearly: process.env.STRIPE_STANDARD_YEARLY_PRICE_ID || 'price_standard_yearly',
    },
    features: [
      { name: 'Up to 20 projects', description: 'Create up to 20 projects', included: true },
      { name: '50 GB storage', description: 'Store up to 50GB of content', included: true },
      { name: 'Video duration up to 2 hours', description: 'Upload videos up to 2 hours', included: true },
      { name: 'HD video processing', description: 'Process videos in HD quality', included: true },
      { name: 'Advanced analytics', description: 'Detailed analytics and insights', included: true },
      { name: 'Email support', description: 'Get email support from our team', included: true },
      { name: 'ASL caption support', description: 'Automatic ASL captions for accessibility', included: true },
      { name: 'Custom branding', description: 'Add your own branding to content', included: true },
      { name: 'Priority support', description: '24/7 priority support', included: false },
    ],
    maxProjects: 20,
    maxStorage: 50,
    maxVideoDuration: 120,
    popular: true,
    priority: 2,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'For professional creators and teams',
    price: {
      monthly: 49.99,
      yearly: 499.99,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
    },
    features: [
      { name: 'Unlimited projects', description: 'Create unlimited projects', included: true },
      { name: '200 GB storage', description: 'Store up to 200GB of content', included: true },
      { name: 'Unlimited video duration', description: 'Upload videos of any length', included: true },
      { name: '4K video processing', description: 'Process videos in 4K quality', included: true },
      { name: 'Advanced analytics', description: 'Detailed analytics with custom reports', included: true },
      { name: 'Priority support', description: '24/7 priority support', included: true },
      { name: 'ASL caption support', description: 'Automatic ASL captions for accessibility', included: true },
      { name: 'Custom branding', description: 'Add your own branding to content', included: true },
      { name: 'API access', description: 'Access our API for custom integrations', included: true },
      { name: 'White-label options', description: 'Fully white-label the platform', included: true },
      { name: 'Dedicated account manager', description: 'Get a dedicated account manager', included: true },
    ],
    maxProjects: -1, // unlimited
    maxStorage: 200,
    maxVideoDuration: -1, // unlimited
    priority: 3,
  },
}

export const FREE_TIER: SubscriptionTier = {
  id: 'free',
  name: 'Free',
  description: 'Try out the platform with limited features',
  price: {
    monthly: 0,
    yearly: 0,
  },
  stripePriceIds: {
    monthly: '',
    yearly: '',
  },
  features: [
    { name: '1 project', description: 'Create 1 project', included: true },
    { name: '1 GB storage', description: 'Store up to 1GB of content', included: true },
    { name: 'Video duration up to 10 minutes', description: 'Upload videos up to 10 minutes', included: true },
    { name: 'Standard video processing', description: 'Process videos with standard quality', included: true },
    { name: 'Basic analytics', description: 'View basic analytics', included: true },
    { name: 'Community support', description: 'Get help from the community', included: true },
    { name: 'ASL caption support', description: 'Automatic ASL captions for accessibility', included: true },
  ],
  maxProjects: 1,
  maxStorage: 1,
  maxVideoDuration: 10,
  priority: 0,
}

export const ALL_TIERS = [FREE_TIER, ...Object.values(SUBSCRIPTION_TIERS)]

/**
 * Get a subscription tier by ID
 */
export function getSubscriptionTier(tierId: string): SubscriptionTier | undefined {
  if (tierId === 'free') return FREE_TIER
  return SUBSCRIPTION_TIERS[tierId]
}

/**
 * Get tier by Stripe price ID
 */
export function getTierByPriceId(priceId: string): SubscriptionTier | undefined {
  return ALL_TIERS.find(
    (tier) => tier.stripePriceIds.monthly === priceId || tier.stripePriceIds.yearly === priceId
  )
}

/**
 * Check if a feature is available in a tier
 */
export function isFeatureAvailable(tierId: string, featureName: string): boolean {
  const tier = getSubscriptionTier(tierId)
  if (!tier) return false
  
  const feature = tier.features.find((f) => f.name === featureName)
  return feature?.included ?? false
}

/**
 * Get billing interval from price ID
 */
export function getBillingInterval(priceId: string): 'monthly' | 'yearly' | undefined {
  const tier = getTierByPriceId(priceId)
  if (!tier) return undefined
  
  if (tier.stripePriceIds.monthly === priceId) return 'monthly'
  if (tier.stripePriceIds.yearly === priceId) return 'yearly'
  return undefined
}
