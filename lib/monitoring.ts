// Monitoring and Analytics utilities
import { query } from './db';

// Track analytics event in database
export async function trackEvent(
  eventName: string,
  userId?: string,
  properties?: Record<string, any>
) {
  try {
    await query(
      `INSERT INTO analytics_events (event_name, user_id, properties, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [eventName, userId, JSON.stringify(properties || {})]
    );
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Log structured data
export function logInfo(message: string, data?: Record<string, any>) {
  const logEntry = {
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  if (process.env.NODE_ENV === 'production') {
    // In production, send to logging service
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(message, data);
  }
}

export function logError(message: string, error?: any, data?: Record<string, any>) {
  const logEntry = {
    level: 'error',
    message,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  if (process.env.NODE_ENV === 'production') {
    // In production, send to error tracking service
    console.error(JSON.stringify(logEntry));
  } else {
    console.error(message, error, data);
  }
}

export function logWarning(message: string, data?: Record<string, any>) {
  const logEntry = {
    level: 'warning',
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  if (process.env.NODE_ENV === 'production') {
    // In production, send to logging service
    console.warn(JSON.stringify(logEntry));
  } else {
    console.warn(message, data);
  }
}

// Performance monitoring
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      logInfo(`Performance: ${name}`, { duration });
      
      if (duration > 1000) {
        logWarning(`Slow operation detected: ${name}`, { duration });
      }
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      logError(`Failed operation: ${name}`, error, { duration });
      reject(error);
    }
  });
}
