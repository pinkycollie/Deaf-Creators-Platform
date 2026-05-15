'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Pricing constants
const PRICING = {
  vercel: { base: 20, perUser: 0 },
  neon: { base: 25, perGB: 5 },
  pinksyncAPI: { base: 50, perRequest: 0.001 },
  stripe: { percentage: 0.029, fixed: 0.30 },
  cloudflareR2: { base: 5, perGB: 0.015 },
  
  creatorTiers: {
    contractor: {
      threshold: 0,
      projectFee: 0.65,
      benefits: 0,
      description: 'Independent Contractor'
    },
    regular: {
      threshold: 5000,
      projectFee: 0.60,
      benefits: 200,
      description: 'Regular Contractor'
    },
    agency: {
      threshold: 10000,
      projectFee: 0.55,
      benefits: 500,
      bonus: 0.05,
      description: 'Agency Level'
    }
  }
};

interface EstimatorInputs {
  users: number;
  projects: number;
  avgProjectValue: number;
  storageGB: number;
  creatorCount: number;
  avgCreatorEarnings: number;
}

interface PlatformCosts {
  vercel: number;
  neon: number;
  pinksync: number;
  cloudflare: number;
  stripe: number;
  total: number;
  totalRevenue: number;
}

interface CreatorCompensation {
  tier: string;
  projectPayout: number;
  bonus: number;
  benefits: number;
  total: number;
}

export default function CostEstimator() {
  const [inputs, setInputs] = useState<EstimatorInputs>({
    users: 10000,
    projects: 500,
    avgProjectValue: 1000,
    storageGB: 100,
    creatorCount: 50,
    avgCreatorEarnings: 8000
  });

  const [results, setResults] = useState<{
    platformCosts: PlatformCosts | null;
    creatorComp: CreatorCompensation | null;
  }>({
    platformCosts: null,
    creatorComp: null
  });

  const calculatePlatformCosts = (
    users: number,
    projects: number,
    avgProjectValue: number,
    storageGB: number
  ): PlatformCosts => {
    const totalRevenue = projects * avgProjectValue;
    
    const costs = {
      vercel: PRICING.vercel.base,
      neon: PRICING.neon.base + Math.ceil(storageGB / 5) * PRICING.neon.perGB,
      pinksync: PRICING.pinksyncAPI.base + (projects * 100 * PRICING.pinksyncAPI.perRequest),
      cloudflare: PRICING.cloudflareR2.base + (storageGB * PRICING.cloudflareR2.perGB),
      stripe: totalRevenue * PRICING.stripe.percentage + (projects * PRICING.stripe.fixed)
    };
    
    return {
      ...costs,
      total: Object.values(costs).reduce((sum, cost) => sum + cost, 0),
      totalRevenue
    };
  };

  const calculateCreatorCompensation = (
    monthlyEarnings: number,
    projectValue: number
  ): CreatorCompensation => {
    let tier = PRICING.creatorTiers.contractor;
    
    if (monthlyEarnings >= PRICING.creatorTiers.agency.threshold) {
      tier = PRICING.creatorTiers.agency;
    } else if (monthlyEarnings >= PRICING.creatorTiers.regular.threshold) {
      tier = PRICING.creatorTiers.regular;
    }
    
    const projectPayout = projectValue * tier.projectFee;
    const bonus = tier.bonus ? projectValue * tier.bonus : 0;
    const benefits = tier.benefits || 0;
    
    return {
      tier: tier.description,
      projectPayout,
      bonus,
      benefits,
      total: projectPayout + bonus
    };
  };

  const handleCalculate = () => {
    const platformCosts = calculatePlatformCosts(
      inputs.users,
      inputs.projects,
      inputs.avgProjectValue,
      inputs.storageGB
    );
    
    const creatorComp = calculateCreatorCompensation(
      inputs.avgCreatorEarnings,
      inputs.avgProjectValue
    );
    
    setResults({ platformCosts, creatorComp });
  };

  const handleInputChange = (field: keyof EstimatorInputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const creatorPayoutTotal = results.platformCosts 
    ? results.platformCosts.totalRevenue * 0.60 
    : 0;
  
  const platformMargin = results.platformCosts
    ? results.platformCosts.totalRevenue - creatorPayoutTotal - results.platformCosts.total
    : 0;
  
  const marginPercent = results.platformCosts && results.platformCosts.totalRevenue > 0
    ? (platformMargin / results.platformCosts.totalRevenue)
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">PinkSync Cost Estimator</h1>
        <p className="text-muted-foreground">
          Calculate platform costs and creator compensation for creators.pinksync.io
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Inputs</CardTitle>
            <CardDescription>Enter your platform metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="users">Monthly Active Users</Label>
              <Input
                id="users"
                type="number"
                value={inputs.users}
                onChange={(e) => handleInputChange('users', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="projects">Projects per Month</Label>
              <Input
                id="projects"
                type="number"
                value={inputs.projects}
                onChange={(e) => handleInputChange('projects', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="avgProjectValue">Average Project Value ($)</Label>
              <Input
                id="avgProjectValue"
                type="number"
                value={inputs.avgProjectValue}
                onChange={(e) => handleInputChange('avgProjectValue', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="storageGB">Storage (GB)</Label>
              <Input
                id="storageGB"
                type="number"
                value={inputs.storageGB}
                onChange={(e) => handleInputChange('storageGB', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="creatorCount">Number of Active Creators</Label>
              <Input
                id="creatorCount"
                type="number"
                value={inputs.creatorCount}
                onChange={(e) => handleInputChange('creatorCount', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="avgCreatorEarnings">Avg Creator Monthly Earnings ($)</Label>
              <Input
                id="avgCreatorEarnings"
                type="number"
                value={inputs.avgCreatorEarnings}
                onChange={(e) => handleInputChange('avgCreatorEarnings', e.target.value)}
              />
            </div>
            
            <Button onClick={handleCalculate} className="w-full">
              Calculate Estimate
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.platformCosts && results.creatorComp && (
          <div className="space-y-6">
            {/* Platform Costs */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Costs</CardTitle>
                <CardDescription>Monthly operational expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Vercel (Hosting)</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.vercel)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Neon (Database)</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.neon)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">PinkSync API</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.pinksync)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cloudflare R2</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.cloudflare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Stripe Processing</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.stripe)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Platform Costs</span>
                  <span>{formatCurrency(results.platformCosts.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Creator Compensation */}
            <Card>
              <CardHeader>
                <CardTitle>Creator Compensation</CardTitle>
                <CardDescription>
                  Tier: <Badge variant="secondary">{results.creatorComp.tier}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Project Payout</span>
                  <span className="font-medium">{formatCurrency(results.creatorComp.projectPayout)}</span>
                </div>
                {results.creatorComp.bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Performance Bonus</span>
                    <span className="font-medium text-green-600">{formatCurrency(results.creatorComp.bonus)}</span>
                  </div>
                )}
                {results.creatorComp.benefits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm">Benefits Package</span>
                    <span className="font-medium">{formatCurrency(results.creatorComp.benefits)}/mo</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total per Project</span>
                  <span>{formatCurrency(results.creatorComp.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Platform Economics */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Economics</CardTitle>
                <CardDescription>Revenue and margin breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Gross Revenue</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Creator Payouts (60%)</span>
                  <span className="font-medium">{formatCurrency(creatorPayoutTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Platform Costs</span>
                  <span className="font-medium">{formatCurrency(results.platformCosts.total)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Platform Margin</span>
                  <span className="text-green-600">
                    {formatCurrency(platformMargin)} ({formatPercent(marginPercent)})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Growth Incentives */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Incentives</CardTitle>
                <CardDescription>Expense offset strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Volume discounts at $50k+ monthly revenue</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Health benefits at $5k+ monthly earnings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>5% performance bonus at agency tier</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Equipment stipend ($100/mo) for top creators</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Training credits ($50/mo) for skill development</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>$250 referral bonuses for creator recruitment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
