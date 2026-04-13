import { Elysia } from "elysia";
import { webhookRoutes } from "./modules/webhook";
import { knowledgeRoutes } from "./modules/knowledge";
import { autoReplyRoutes } from "./modules/auto-reply";
import { adminRoutes } from "./modules/admin";

const app = new Elysia()
  .onRequest(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type";
  })
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "fbagent-backend",
    version: "0.1.0"
  }))
  .use(webhookRoutes)
  .use(knowledgeRoutes)
  .use(autoReplyRoutes)
  .use(adminRoutes)
  .listen(9000);

console.log("🚀 Backend running at http://localhost:9000");
console.log("📡 Webhook endpoint: http://localhost:9000/webhook");
console.log("📚 Knowledge API: http://localhost:9000/api/knowledge");
console.log("🤖 Auto-reply API: http://localhost:9000/api/auto-reply");
console.log("⚙️  Admin API: http://localhost:9000/api/admin");

export type App = typeof app;
