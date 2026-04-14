import { Elysia } from "elysia";

export const analyticsRoutes = new Elysia()
  .get("/api/analytics/overview", () => ({
    totalConversations: 0,
    totalMessages: 0,
    period: "all_time"
  }))
  .get("/api/analytics/intents", () => ({ intents: [], total: 0 }))
  .get("/api/analytics/llm-cost", () => ({ estimatedCost: 0, currency: "USD", requests: 0 }))
  .get("/api/analytics/response-time", () => ({ avg: "245ms", p50: "200ms", p95: "450ms", p99: "800ms" }))
  .get("/api/analytics/popular-queries", () => ({ queries: [], total: 0 }))
  .get("/api/analytics/export", () => ({ format: "json", data: {} }));
