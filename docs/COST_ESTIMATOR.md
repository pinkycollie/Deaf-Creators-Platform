# PinkSync Cost Estimator

Interactive cost benchmark tool for the creators.pinksync.io platform, featuring creator compensation splits, tier-based benefits, and expense offset strategies.

## Overview

The PinkSync Cost Estimator helps you understand:
- Platform operational costs (Vercel, Neon, PinkSync API, Stripe, Cloudflare R2)
- Creator compensation structures at different earning levels
- Revenue splits and margin projections
- Growth incentives and ongoing expense offsets

## Quick Start

```bash
# Run the interactive estimator
node scripts/pinksync-estimator.js

# Or make it executable and run directly
chmod +x scripts/pinksync-estimator.js
./scripts/pinksync-estimator.js
```

## Creator Compensation Tiers

### 1. Independent Contractor (Entry Level)
- **Threshold**: $0 - $4,999/month
- **Project Split**: 65% to creator
- **Benefits**: None
- **Status**: 1099 contractor

**Example**: $1,000 project = $650 to creator

### 2. Regular Contractor (Mid Level)
- **Threshold**: $5,000 - $9,999/month
- **Project Split**: 60% to creator
- **Benefits**: $200/month health insurance stipend
- **Status**: 1099 contractor with benefits

**Example**: $1,000 project = $600 to creator + $200/mo benefits

### 3. Agency Level (Top Tier)
- **Threshold**: $10,000+/month
- **Project Split**: 55% to creator
- **Benefits**: $500/month full benefits package
- **Performance Bonus**: 5% of project value
- **Status**: Agency representation

**Example**: $1,000 project = $550 + $50 bonus = $600 to creator + $500/mo benefits

## Growth Incentives & Expense Offsets

### Platform-Level Incentives
- **Volume Discounts**: 5% off platform fees at $50k+ monthly revenue
- **Bulk Storage**: Reduced rates for high-volume video storage
- **API Credits**: Bonus PinkSync API credits for consistent usage

### Creator-Level Incentives
1. **Health Benefits** ($5k+ tier)
   - Health insurance stipend: $200-500/month
   - Offsets contractor healthcare costs
   - Tax-advantaged through platform

2. **Performance Bonuses** ($10k+ tier)
   - 5% of project value as performance bonus
   - Paid quarterly based on completed projects
   - Rewards quality and consistency

3. **Equipment Stipend** (Agency tier)
   - $100/month for equipment upgrades
   - Cameras, lighting, editing software
   - Keeps creators competitive

4. **Training Credits**
   - $50/month for skill development
   - ASL certification courses
   - Video production training
   - Platform tutorials

5. **Referral Bonuses**
   - $250 per qualified creator referral
   - Must complete 3 projects to qualify
   - Helps grow creator network

6. **Loyalty Rewards**
   - 1% project split increase per year (up to 70%)
   - For creators maintaining agency tier
   - Long-term retention incentive

## Sample Calculations

### Scenario 1: Growing Platform
```
Inputs:
- Monthly Active Users: 10,000
- Projects per Month: 500
- Average Project Value: $1,000
- Storage: 100 GB
- Active Creators: 50
- Avg Creator Monthly Earnings: $8,000

Results:
- Platform Costs: ~$150/month
- Total Revenue: $500,000/month
- Creator Payouts (60%): $300,000/month
- Platform Margin: ~$199,850/month (40%)
- Avg per Creator: $6,000/month (Regular Contractor tier)
```

### Scenario 2: Mature Platform
```
Inputs:
- Monthly Active Users: 50,000
- Projects per Month: 2,000
- Average Project Value: $1,500
- Storage: 500 GB
- Active Creators: 200
- Avg Creator Monthly Earnings: $12,000

Results:
- Platform Costs: ~$300/month
- Total Revenue: $3,000,000/month
- Creator Payouts (60%): $1,800,000/month
- Platform Margin: ~$1,199,700/month (40%)
- Avg per Creator: $9,000/month (Agency tier eligible)
```

## Cost Breakdown

### Fixed Monthly Costs
| Service | Base Cost | Variable Cost |
|---------|-----------|---------------|
| Vercel Pro | $20 | - |
| Neon Database | $25 | +$5 per 5GB |
| PinkSync API | $50 | +$0.001 per request |
| Cloudflare R2 | $5 | +$0.015 per GB |
| Stripe Processing | - | 2.9% + $0.30 per transaction |

### Creator Compensation Structure

```
Revenue Split by Tier:
┌─────────────────────┬─────────┬──────────┬─────────┐
│ Tier                │ Split   │ Benefits │ Bonus   │
├─────────────────────┼─────────┼──────────┼─────────┤
│ Contractor          │ 65%     │ $0       │ 0%      │
│ Regular Contractor  │ 60%     │ $200/mo  │ 0%      │
│ Agency Level        │ 55%     │ $500/mo  │ 5%      │
└─────────────────────┴─────────┴──────────┴─────────┘

Note: Effective payout at Agency tier is 60% (55% + 5% bonus)
```

## Expense Offset Timeline

### Year 1: Contractor Phase
- **Month 1-3**: 65% project split, no benefits
- **Month 4-6**: Eligible for training credits ($50/mo)
- **Month 7-12**: Referral bonuses available

### Year 2: Growth Phase
- **$5k+ monthly**: Health benefits kick in ($200/mo offset)
- **Consistent work**: Volume bonuses for 10+ projects/month
- **Equipment stipend**: Available upon request

### Year 3: Agency Phase
- **$10k+ monthly**: Full agency benefits ($500/mo)
- **Performance bonuses**: Quarterly 5% bonus payments
- **Loyalty rewards**: Split increases to 56-57%

## Integration with Platform

The estimator can be integrated into the platform dashboard:

```typescript
// Example API integration
import { calculateCreatorCompensation } from './scripts/pinksync-estimator.js';

const compensation = calculateCreatorCompensation(
  creatorMonthlyEarnings,
  projectValue
);

// Display in creator dashboard
console.log(`Your tier: ${compensation.tier}`);
console.log(`Project payout: $${compensation.projectPayout}`);
console.log(`Benefits: $${compensation.benefits}/mo`);
```

## Usage Examples

### Interactive Mode
```bash
$ node scripts/pinksync-estimator.js

╔════════════════════════════════════════════════════════════════════╗
║        PINKSYNC INTERACTIVE COST ESTIMATOR                         ║
║        For creators.pinksync.io Platform                           ║
╚════════════════════════════════════════════════════════════════════╝

Monthly Active Users (e.g., 10000): 10000
Projects per Month (e.g., 500): 500
Average Project Value $ (e.g., 1000): 1000
Storage (GB) (e.g., 100): 100
Number of Active Creators (e.g., 50): 50
Avg Creator Monthly Earnings $ (e.g., 8000): 8000

[Results displayed...]

Save this estimate to file? (y/n): y
✓ Estimate saved to pinksync-estimate-1638720000000.json
```

### Programmatic Usage
```javascript
const { calculatePlatformCosts, calculateCreatorCompensation } = require('./scripts/pinksync-estimator.js');

// Calculate platform costs
const costs = calculatePlatformCosts(10000, 500, 1000, 100);
console.log('Total platform costs:', costs.total);

// Calculate creator compensation
const comp = calculateCreatorCompensation(8000, 1000);
console.log('Creator tier:', comp.tier);
console.log('Project payout:', comp.projectPayout);
```

## NPM Script Integration

Add to `package.json`:

```json
{
  "scripts": {
    "estimate": "node scripts/pinksync-estimator.js",
    "estimate:help": "node scripts/pinksync-estimator.js --help"
  }
}
```

Then run:
```bash
npm run estimate
```

## Data Export

Estimates can be saved as JSON for:
- Financial planning
- Investor presentations
- Creator recruitment materials
- Platform analytics

Example output file:
```json
{
  "timestamp": "2025-12-05T04:54:00.000Z",
  "inputs": {
    "users": 10000,
    "projects": 500,
    "avgProjectValue": 1000,
    "storageGB": 100,
    "creatorCount": 50,
    "avgCreatorEarnings": 8000
  },
  "platformCosts": {
    "vercel": 20,
    "neon": 25,
    "pinksync": 50.5,
    "cloudflare": 6.5,
    "stripe": 14650,
    "total": 14752
  },
  "creatorCompensation": {
    "tier": "Regular Contractor (w/ benefits)",
    "projectPayout": 600,
    "bonus": 0,
    "benefits": 200,
    "total": 600
  }
}
```

## Key Metrics

### Platform Health Indicators
- **Creator Retention**: Target 80%+ yearly
- **Average Project Value**: Track growth over time
- **Creator Tier Distribution**: Aim for 20% at agency tier
- **Platform Margin**: Maintain 35-45%

### Creator Success Metrics
- **Time to First Payment**: < 7 days
- **Monthly Earnings Growth**: Track individual trajectories
- **Benefits Enrollment**: Monitor uptake at each tier
- **Satisfaction Scores**: Survey quarterly

## Financial Planning

### Conservative Estimate (Year 1)
- 1,000 MAU
- 50 projects/month
- $800 avg project value
- **Platform costs**: ~$120/mo
- **Revenue**: $40,000/mo
- **Creator payouts**: $24,000/mo
- **Net margin**: ~$15,880/mo

### Growth Estimate (Year 2)
- 10,000 MAU
- 500 projects/month
- $1,000 avg project value
- **Platform costs**: ~$150/mo
- **Revenue**: $500,000/mo
- **Creator payouts**: $300,000/mo
- **Net margin**: ~$199,850/mo

### Scale Estimate (Year 3)
- 50,000 MAU
- 2,000 projects/month
- $1,500 avg project value
- **Platform costs**: ~$300/mo
- **Revenue**: $3,000,000/mo
- **Creator payouts**: $1,800,000/mo
- **Net margin**: ~$1,199,700/mo

## Support

For questions about the cost estimator:
1. Review this documentation
2. Check example calculations above
3. Run the interactive tool for custom scenarios
4. Contact platform@pinksync.io for enterprise estimates

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Maintainer**: PinkSync Platform Team
