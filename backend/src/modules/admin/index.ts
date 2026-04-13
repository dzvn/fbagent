import { Elysia, t } from "elysia";

const stats = {
  totalConversations: 0,
  totalMessages: 0,
  autoRepliesSent: 0,
  kbArticles: 0,
  lastUpdated: new Date()
};

export const adminRoutes = new Elysia()
  .get("/api/admin/stats", () => {
    stats.lastUpdated = new Date();
    return stats;
  })
  .get("/api/admin/config", () => {
    return {
      fbVerifyToken: process.env.FB_VERIFY_TOKEN || "not_set",
      fbPageToken: process.env.FB_PAGE_ACCESS_TOKEN ? "configured" : "not_set",
      webhookUrl: process.env.WEBHOOK_URL || "not_set",
      autoReplyEnabled: true,
      confidenceThreshold: 0.5
    };
  })
  .post("/api/admin/config", ({ body }: { body: any }) => {
    return { success: true, message: "Config updated", data: body };
  }, {
    body: t.Object({
      fbVerifyToken: t.Optional(t.String()),
      fbPageToken: t.Optional(t.String()),
      webhookUrl: t.Optional(t.String()),
      autoReplyEnabled: t.Optional(t.Boolean()),
      confidenceThreshold: t.Optional(t.Number())
    })
  })
  .get("/api/admin/logs", ({ query }: { query: Record<string, string> }) => {
    const limit = parseInt(query.limit || "100");
    return { logs: [], total: 0, limit };
  });
