import { Elysia } from "elysia";

/**
 * API Key Authentication Middleware
 * Validates x-api-key header against configured API_KEY
 */
export function createApiKeyMiddleware() {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️  API_KEY not set in environment. API authentication disabled.");
  }
  
  return new Elysia()
    .derive(({ request, set }) => {
      // Skip authentication for certain paths
      const url = new URL(request.url);
      const publicPaths = ["/health", "/api/models", "/webhook"];
      
      if (publicPaths.some(path => url.pathname.startsWith(path))) {
        return { isAuthenticated: true };
      }
      
      // Check for API key in header
      const providedKey = request.headers.get("x-api-key");
      
      if (!apiKey) {
        // If no API_KEY configured, allow all requests (development mode)
        return { isAuthenticated: true };
      }
      
      if (!providedKey || providedKey !== apiKey) {
        set.status = 401;
        throw new Error("Unauthorized: Invalid or missing API key");
      }
      
      return { isAuthenticated: true };
    });
}
