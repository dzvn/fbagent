import { Elysia } from "elysia";
import { webhookRoutes } from "./modules/webhook";
import { knowledgeRoutes } from "./modules/knowledge";
import { autoReplyRoutes } from "./modules/auto-reply";
import { adminRoutes } from "./modules/admin";
import { buildAgentWorkflow } from "./langgraph/workflow";
import { chatWithLLM, getDefaultAgentConfig, type AgentConfig } from "./agent/agent";
import { SUPPORTED_MODELS } from "./config/models";
import { createApiKeyMiddleware } from "./middleware/apiKey";
import { createRateLimitMiddleware } from "./middleware/rateLimit";

const agentWorkflow = buildAgentWorkflow();
let currentAgentConfig: AgentConfig = getDefaultAgentConfig();

// Helper to sanitize config for frontend (excludes sensitive data)
function sanitizeConfig(config: AgentConfig) {
  return {
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    temperature: config.temperature
    // apiKey is intentionally excluded for security
  };
}

async function processWithLangGraph(message: string, senderId: string, pageId: string, useLLM = true) {
  try {
    const result = await agentWorkflow.invoke({
      messages: [],
      senderId,
      pageId,
      currentMessage: message,
      intent: null,
      orderDetected: false,
      orderInfo: null,
      response: null,
      needsHumanHandoff: false,
      useLLM
    });
    
    return {
      response: result.response || "Xin lỗi, mình chưa hiểu câu hỏi của bạn.",
      intent: result.intent,
      orderDetected: result.orderDetected,
      orderInfo: result.orderInfo,
      needsHumanHandoff: result.needsHumanHandoff,
      source: useLLM ? "llm-enhanced" : "langgraph"
    };
  } catch (error) {
    console.error("LangGraph error:", error);
    return {
      response: "Xin lỗi, hiện tại mình đang gặp sự cố. Bạn thử lại sau nhé!",
      intent: null,
      orderDetected: false,
      needsHumanHandoff: true,
      source: "error"
    };
  }
}

async function processWithLLMAgent(message: string, conversationHistory: string[]) {
  try {
    const response = await chatWithLLM(currentAgentConfig, message, conversationHistory);
    return {
      response,
      source: "llm-agent",
      model: currentAgentConfig.model
    };
  } catch (error) {
    console.error("LLM Agent error:", error);
    return {
      response: "Xin lỗi, mình đang gặp sự cố kết nối.",
      source: "error"
    };
  }
}

const app = new Elysia()
  .onRequest(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With,x-api-key";
    set.headers["Access-Control-Allow-Credentials"] = "true";
    set.headers["Access-Control-Max-Age"] = "86400";
  })
  .options("/*", () => ({ status: "ok" }))
  
  // Apply rate limiting middleware (skip /health endpoint)
  .use(createRateLimitMiddleware({
    windowMs: 60000,  // 1 minute
    max: 100,         // 100 requests per minute
    skipPaths: ["/health"]
  }))
  
  // Apply API key middleware to protected routes
  .use(createApiKeyMiddleware())
  
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "fbagent-backend",
    version: "0.2.1-llm"
  }))
  
  .post("/api/langgraph/process", async ({ body }: { body: any }) => {
    const { message, senderId, pageId, useLLM = true } = body;
    const result = await processWithLangGraph(message, senderId || "unknown", pageId || "unknown", useLLM);
    return result;
  })
  
  .post("/api/agent/chat", async ({ body }: { body: any }) => {
    const { message, conversationHistory = [] } = body;
    const result = await processWithLLMAgent(message, conversationHistory);
    return result;
  })
  
  .get("/api/models", () => ({
    models: SUPPORTED_MODELS,
    currentConfig: sanitizeConfig(currentAgentConfig)
  }))
  
  .post("/api/models/config", ({ body }: { body: any }) => {
    const { provider, model, apiKey, baseUrl, temperature } = body;
    currentAgentConfig = {
      provider: provider || currentAgentConfig.provider,
      model: model || currentAgentConfig.model,
      apiKey: apiKey || currentAgentConfig.apiKey,
      baseUrl: baseUrl || currentAgentConfig.baseUrl,
      temperature: temperature || currentAgentConfig.temperature
    };
    return { success: true, config: sanitizeConfig(currentAgentConfig) };
  })
  
  .use(webhookRoutes)
  .use(knowledgeRoutes)
  .use(autoReplyRoutes)
  .use(adminRoutes)
  .listen(9000);

console.log("🚀 Backend running at http://localhost:9000");
console.log("🔒 API Key Auth: Enabled for protected endpoints");
console.log("⚡ Rate Limiting: 100 req/min per IP (skip /health)");
console.log("🧠 LangGraph (with LLM): http://localhost:9000/api/langgraph/process");
console.log("🤖 LLM Agent (Direct): http://localhost:9000/api/agent/chat");
console.log("📦 Models: http://localhost:9000/api/models");
console.log("🔓 CORS: Enabled for all origins (*)");

export type App = typeof app;
