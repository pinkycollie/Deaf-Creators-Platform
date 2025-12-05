import { Pool } from '@neondatabase/serverless';

// For serverless environments (Vercel Edge)
export const neonPool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Connection health check
export async function checkDatabaseHealth() {
  try {
    const client = await neonPool.connect();
    const start = Date.now();
    const result = await client.query('SELECT 1');
    const latency = Date.now() - start;
    client.release();
    return { healthy: true, latency };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Execute query with connection pooling
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await neonPool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Execute transaction
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await neonPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
