import { checkDatabaseHealth } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    // Test PinkSync API (optional)
    let pinksyncHealth = false;
    try {
      const pinksyncResponse = await fetch('https://api.pinksync.io/v1/health', {
        signal: AbortSignal.timeout(5000),
      });
      pinksyncHealth = pinksyncResponse.ok;
    } catch {
      // PinkSync API might not be available
      pinksyncHealth = false;
    }
    
    const status = dbHealth.healthy ? 200 : 503;
    
    return NextResponse.json({
      status: status === 200 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.healthy ? 'healthy' : 'unhealthy',
        databaseLatency: dbHealth.latency,
        pinksync: pinksyncHealth ? 'healthy' : 'unknown',
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    }, { status });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}
