/**
 * Rate limiting utility for Melodia Up To Africa
 * 
 * Uses in-memory store by default. Redis (ioredis) is optional
 * and only used when REDIS_URL is set in environment.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (fallback when Redis is unavailable)
const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60_000);

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
  /** Use RedisCredis URL from env) */
  useRedis?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetTime = now + options.windowMs;

  // Try Redis if configured and requested
  if (options.useRedis && process.env.REDIS_URL) {
    try {
      // Lazy import — keeps the dep optional
      const mod = await import("ioredis");
      const Redis = mod.default;
      const client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      const current = await client.incr(key);
      if (current === 1) {
        await client.pexpire(key, options.windowMs);
      }
      const ttl = await client.pttl(key);

      await client.quit();

      return {
        allowed: current <= options.max,
        remaining: Math.max(0, options.max - current),
        resetTime: now + ttl,
        total: options.max,
      };
    } catch {
      // Fall back to in-memory if Redis fails
    }
  }

  // In-memory rate limiting
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetTime,
      total: options.max,
    };
  }

  entry.count++;
  return {
    allowed: entry.count <= options.max,
    remaining: Math.max(0, options.max - entry.count),
    resetTime: entry.resetTime,
    total: options.max,
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /** API general: 100 requests per minute */
  api: (key: string) =>
    checkRateLimit(`rl:api:${key}`, { windowMs: 60_000, max: 100 }),

  /** Song generation: 5 per minute (expensive) */
  generate: (key: string) =>
    checkRateLimit(`rl:gen:${key}`, { windowMs: 60_000, max: 5 }),

  /** Auth: 10 attempts per minute */
  auth: (key: string) =>
    checkRateLimit(`rl:auth:${key}`, { windowMs: 60_000, max: 10 }),

  /** Signup: 3 per hour */
  signup: (key: string) =>
    checkRateLimit(`rl:signup:${key}`, { windowMs: 3_600_000, max: 3 }),
};
