import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get("/", () => ({ 
    name: "FB Agent API",
    version: "0.1.0",
    status: "running"
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .listen(9000);

console.log(`🦊 Backend API running at http://localhost:${app.server?.port}`);
