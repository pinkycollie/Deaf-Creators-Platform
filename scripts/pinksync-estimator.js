#!/usr/bin/env node

/**
 * PinkSync Cost Estimator
 * Interactive cost benchmark with creator compensation splits
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pricing tiers and thresholds
const PRICING = {
  // Platform costs
  vercel: { base: 20, perUser: 0 },
  neon: { base: 25, perGB: 5 },
  pinksyncAPI: { base: 50, perRequest: 0.001 },
  stripe: { percentage: 0.029, fixed: 0.30 },
  cloudflareR2: { base: 5, perGB: 0.015 },
  
  // Creator compensation tiers
  creatorTiers: {
    contractor: {
      threshold: 0,
      projectFee: 0.65, // 65% of project value
      benefits: 0,
      description: 'Independent Contractor'
    },
    regular: {
      threshold: 5000, // $5k monthly earnings
      projectFee: 0.60, // 60% of project value
      benefits: 200, // $200/mo health insurance stipend
      description: 'Regular Contractor (w/ benefits)'
    },
    agency: {
      threshold: 10000, // $10k monthly earnings
      projectFee: 0.55, // 55% of project value
      benefits: 500, // $500/mo full benefits package
      bonus: 0.05, // 5% performance bonus
      description: 'Agency Level (w/ full benefits + bonus)'
    }
  }
};

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function calculatePlatformCosts(users, projects, avgProjectValue, storageGB) {
  const monthlyActiveUsers = users;
  const projectsPerMonth = projects;
  const totalRevenue = projectsPerMonth * avgProjectValue;
  
  // Platform costs
  const costs = {
    vercel: PRICING.vercel.base,
    neon: PRICING.neon.base + Math.ceil(storageGB / 5) * PRICING.neon.perGB,
    pinksync: PRICING.pinksyncAPI.base + (projectsPerMonth * 100 * PRICING.pinksyncAPI.perRequest),
    cloudflare: PRICING.cloudflareR2.base + (storageGB * PRICING.cloudflareR2.perGB),
    stripe: totalRevenue * PRICING.stripe.percentage + (projectsPerMonth * PRICING.stripe.fixed)
  };
  
  costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  costs.totalRevenue = totalRevenue;
  
  return costs;
}

function calculateCreatorCompensation(monthlyEarnings, projectValue) {
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
    total: projectPayout + bonus,
    netToCreator: projectPayout + bonus - benefits
  };
}

function displayResults(platformCosts, creatorCount, avgCreatorEarnings, avgProjectValue) {
  console.log('\n' + '='.repeat(70));
  console.log('  PINKSYNC COST ESTIMATOR - FINANCIAL BREAKDOWN');
  console.log('='.repeat(70));
  
  // Platform Costs
  console.log('\n📊 PLATFORM COSTS (Monthly)');
  console.log('-'.repeat(70));
  console.log(`  Vercel (Hosting):           $${platformCosts.vercel.toFixed(2)}`);
  console.log(`  Neon (Database):            $${platformCosts.neon.toFixed(2)}`);
  console.log(`  PinkSync API:               $${platformCosts.pinksync.toFixed(2)}`);
  console.log(`  Cloudflare R2 (Storage):    $${platformCosts.cloudflare.toFixed(2)}`);
  console.log(`  Stripe (Payment Processing): $${platformCosts.stripe.toFixed(2)}`);
  console.log('-'.repeat(70));
  console.log(`  TOTAL PLATFORM COSTS:       $${platformCosts.total.toFixed(2)}`);
  
  // Revenue Breakdown
  console.log('\n💰 REVENUE & COMPENSATION');
  console.log('-'.repeat(70));
  console.log(`  Total Project Revenue:      $${platformCosts.totalRevenue.toFixed(2)}`);
  
  // Sample creator compensation at different tiers
  console.log('\n👥 CREATOR COMPENSATION TIERS');
  console.log('-'.repeat(70));
  
  const tiers = ['contractor', 'regular', 'agency'];
  tiers.forEach(tierKey => {
    const tier = PRICING.creatorTiers[tierKey];
    const sample = calculateCreatorCompensation(tier.threshold, avgProjectValue);
    
    console.log(`\n  ${sample.tier}`);
    console.log(`    Monthly Earnings Threshold: $${tier.threshold.toFixed(0)}+`);
    console.log(`    Project Split: ${(tier.projectFee * 100).toFixed(0)}%`);
    console.log(`    Per $${avgProjectValue.toFixed(0)} project: $${sample.projectPayout.toFixed(2)}`);
    if (sample.bonus > 0) {
      console.log(`    Performance Bonus: $${sample.bonus.toFixed(2)}`);
    }
    if (tier.benefits > 0) {
      console.log(`    Benefits Package: $${tier.benefits.toFixed(2)}/mo`);
    }
    console.log(`    Net per Project: $${sample.total.toFixed(2)}`);
  });
  
  // Projected Creator Earnings
  const avgCompensation = calculateCreatorCompensation(avgCreatorEarnings, avgProjectValue);
  const totalCreatorPayouts = platformCosts.totalRevenue * 0.60; // Average 60% to creators
  
  console.log('\n📈 PROJECTED CREATOR ECONOMICS');
  console.log('-'.repeat(70));
  console.log(`  Number of Active Creators:  ${creatorCount}`);
  console.log(`  Avg Creator Monthly Income: $${avgCreatorEarnings.toFixed(2)}`);
  console.log(`  Current Tier:               ${avgCompensation.tier}`);
  console.log(`  Total Creator Payouts:      $${totalCreatorPayouts.toFixed(2)}`);
  
  // Platform Margin
  const platformMargin = platformCosts.totalRevenue - totalCreatorPayouts - platformCosts.total;
  const marginPercent = (platformMargin / platformCosts.totalRevenue) * 100;
  
  console.log('\n💼 PLATFORM ECONOMICS');
  console.log('-'.repeat(70));
  console.log(`  Gross Revenue:              $${platformCosts.totalRevenue.toFixed(2)}`);
  console.log(`  Creator Payouts (60%):      $${totalCreatorPayouts.toFixed(2)}`);
  console.log(`  Platform Costs:             $${platformCosts.total.toFixed(2)}`);
  console.log(`  Platform Margin:            $${platformMargin.toFixed(2)} (${marginPercent.toFixed(1)}%)`);
  
  // Growth Incentives
  console.log('\n🎯 GROWTH INCENTIVES & OFFSET STRATEGIES');
  console.log('-'.repeat(70));
  console.log('  ✓ Volume Discounts: 5% off platform fees at $50k+ monthly revenue');
  console.log('  ✓ Health Benefits: Provided at $5k+ monthly earnings');
  console.log('  ✓ Performance Bonus: 5% extra at $10k+ monthly (agency tier)');
  console.log('  ✓ Equipment Stipend: $100/mo for creators at agency tier');
  console.log('  ✓ Training Credits: $50/mo for skill development courses');
  console.log('  ✓ Referral Bonuses: $250 per qualified creator referral');
  
  console.log('\n' + '='.repeat(70));
}

function runExample() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        PINKSYNC COST ESTIMATOR - EXAMPLE SCENARIO                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  // Example inputs
  const users = 10000;
  const projects = 500;
  const avgProjectValue = 1000;
  const storageGB = 100;
  const creatorCount = 50;
  const avgCreatorEarnings = 8000;
  
  console.log('Using example inputs:');
  console.log(`  Monthly Active Users: ${users}`);
  console.log(`  Projects per Month: ${projects}`);
  console.log(`  Average Project Value: $${avgProjectValue}`);
  console.log(`  Storage: ${storageGB} GB`);
  console.log(`  Active Creators: ${creatorCount}`);
  console.log(`  Avg Creator Monthly Earnings: $${avgCreatorEarnings}`);
  
  const platformCosts = calculatePlatformCosts(users, projects, avgProjectValue, storageGB);
  displayResults(platformCosts, creatorCount, avgCreatorEarnings, avgProjectValue);
  
  console.log('\n\nTo run with custom inputs, use: node scripts/pinksync-estimator.js --interactive\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Check for non-interactive mode or no TTY
  if (args.includes('--example') || !process.stdin.isTTY) {
    runExample();
    return;
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        PINKSYNC INTERACTIVE COST ESTIMATOR                         ║');
  console.log('║        For creators.pinksync.io Platform                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('This tool estimates platform costs and creator compensation.\n');
  
  try {
    // Get user inputs
    const users = parseInt(await question('Monthly Active Users (e.g., 10000): '));
    const projects = parseInt(await question('Projects per Month (e.g., 500): '));
    const avgProjectValue = parseFloat(await question('Average Project Value $ (e.g., 1000): '));
    const storageGB = parseFloat(await question('Storage (GB) (e.g., 100): '));
    const creatorCount = parseInt(await question('Number of Active Creators (e.g., 50): '));
    const avgCreatorEarnings = parseFloat(await question('Avg Creator Monthly Earnings $ (e.g., 8000): '));
    
    // Calculate costs
    const platformCosts = calculatePlatformCosts(users, projects, avgProjectValue, storageGB);
    
    // Display results
    displayResults(platformCosts, creatorCount, avgCreatorEarnings, avgProjectValue);
    
    // Save option
    console.log('\n');
    const save = await question('Save this estimate to file? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const fs = require('fs');
      const filename = `pinksync-estimate-${Date.now()}.json`;
      const estimate = {
        timestamp: new Date().toISOString(),
        inputs: { users, projects, avgProjectValue, storageGB, creatorCount, avgCreatorEarnings },
        platformCosts,
        creatorCompensation: calculateCreatorCompensation(avgCreatorEarnings, avgProjectValue)
      };
      fs.writeFileSync(filename, JSON.stringify(estimate, null, 2));
      console.log(`\n✓ Estimate saved to ${filename}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { calculatePlatformCosts, calculateCreatorCompensation, PRICING };
