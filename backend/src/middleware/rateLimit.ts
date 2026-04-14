import { Elysia } from "elysia";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter middleware
 * Limits requests per IP address
 */
export function createRateLimitMiddleware(options: {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  skipPaths?: string[];  // Paths to skip rate limiting
} = { windowMs: 60000, max: 100, skipPaths: [] }) {
  
  const { windowMs, max, skipPaths = [] } = options;
  
  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, Math.min(windowMs, 60000));
  
  return new Elysia()
    .derive(({ request, set }) => {
      const url = new URL(request.url);
      
      // Skip rate limiting for specified paths
      if (skipPaths.some(path => url.pathname.startsWith(path))) {
        return { isRateLimited: false };
      }
      
      // Get client IP (check multiple headers for proxies)
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIP = request.headers.get("x-real-ip");
      const clientIP = forwardedFor?.split(",")[0]?.trim() || realIP || "unknown";
      
      const now = Date.now();
      const key = `ratelimit:${clientIP}`;
      
      if (!store[key] || store[key].resetTime < now) {
        // New window
        store[key] = {
          count: 1,
          resetTime: now + windowMs
        };
        return { isRateLimited: false };
      }
      
      // Existing window
      store[key].count++;
      
      if (store[key].count > max) {
        set.status = 429;
        set.headers["Retry-After"] = String(Math.ceil((store[key].resetTime - now) / 1000));
        set.headers["X-RateLimit-Limit"] = String(max);
        set.headers["X-RateLimit-Remaining"] = "0";
        set.headers["X-RateLimit-Reset"] = String(Math.ceil(store[key].resetTime / 1000));
        throw new Error(`Too Many Requests: Rate limit exceeded. Try again in ${Math.ceil((store[key].resetTime - now) / 1000)} seconds.`);
      }
      
      set.headers["X-RateLimit-Limit"] = String(max);
      set.headers["X-RateLimit-Remaining"] = String(max - store[key].count);
      set.headers["X-RateLimit-Reset"] = String(Math.ceil(store[key].resetTime / 1000));
      
      return { isRateLimited: false };
    });
}
