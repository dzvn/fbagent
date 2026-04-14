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
import { createLogger, generateRequestId, createRequestLogger, appLogger } from "./middleware/logger";

const agentWorkflow = buildAgentWorkflow();
let currentAgentConfig: AgentConfig = getDefaultAgentConfig();

const logger = createLogger("fbagent-backend");
const requestLogger = createRequestLogger(logger);

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
    
    logger.info("LangGraph processing completed", {
      intent: result.intent,
      orderDetected: result.orderDetected,
      source: useLLM ? "llm-enhanced" : "langgraph"
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
    logger.error("LangGraph error", {}, error as Error);
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
    logger.info("LLM Agent response generated", {
      source: "llm-agent",
      model: currentAgentConfig.model
    });
    return {
      response,
      source: "llm-agent",
      model: currentAgentConfig.model
    };
  } catch (error) {
    logger.error("LLM Agent error", {}, error as Error);
    return {
      response: "Xin lỗi, mình đang gặp sự cố kết nối.",
      source: "error"
    };
  }
}

const app = new Elysia()
  .onRequest(({ set, request }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With,x-api-key";
    set.headers["Access-Control-Allow-Credentials"] = "true";
    set.headers["Access-Control-Max-Age"] = "86400";
    
    // Attach request ID for tracing
    const requestId = generateRequestId();
    set.headers["X-Request-ID"] = requestId;
    
    // Store start time and request info for logging
    const url = new URL(request.url);
    const startTime = requestLogger.onRequest(requestId, request.method, url.pathname);
    
    // Store in context for later use
    return { requestId, startTime, method: request.method, path: url.pathname } as any;
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
  
  .post("/api/langgraph/process", async ({ body, set }: { body: any, set: any }) => {
    const { message, senderId, pageId, useLLM = true } = body;
    const result = await processWithLangGraph(message, senderId || "unknown", pageId || "unknown", useLLM);
    
    // Log response with request context
    logger.info("API: langgraph/process", {
      requestId: set.headers["X-Request-ID"],
      method: "POST",
      path: "/api/langgraph/process",
      intent: result.intent,
      source: result.source
    });
    
    return result;
  })
  
  .post("/api/agent/chat", async ({ body, set }: { body: any, set: any }) => {
    const { message, conversationHistory = [] } = body;
    const result = await processWithLLMAgent(message, conversationHistory);
    
    logger.info("API: agent/chat", {
      requestId: set.headers["X-Request-ID"],
      method: "POST",
      path: "/api/agent/chat",
      source: result.source
    });
    
    return result;
  })
  
  .get("/api/models", ({ set }) => ({
    models: SUPPORTED_MODELS,
    currentConfig: sanitizeConfig(currentAgentConfig)
  }))
  
  .post("/api/models/config", ({ body, set }: { body: any, set: any }) => {
    const { provider, model, apiKey, baseUrl, temperature } = body;
    currentAgentConfig = {
      provider: provider || currentAgentConfig.provider,
      model: model || currentAgentConfig.model,
      apiKey: apiKey || currentAgentConfig.apiKey,
      baseUrl: baseUrl || currentAgentConfig.baseUrl,
      temperature: temperature || currentAgentConfig.temperature
    };
    
    logger.info("API: models/config updated", {
      requestId: set.headers["X-Request-ID"],
      method: "POST",
      path: "/api/models/config",
      provider: currentAgentConfig.provider,
      model: currentAgentConfig.model
      // Note: apiKey is intentionally not logged
    });
    
    return { success: true, config: sanitizeConfig(currentAgentConfig) };
  })
  
  .use(webhookRoutes)
  .use(knowledgeRoutes)
  .use(autoReplyRoutes)
  .use(adminRoutes)
  .listen(9000);

logger.info("🚀 Backend started", {
  port: 9000,
  cors: "enabled",
  apiAuth: "enabled",
  rateLimit: "100 req/min"
});

console.log("🚀 Backend running at http://localhost:9000");
console.log("🔒 API Key Auth: Enabled for protected endpoints");
console.log("⚡ Rate Limiting: 100 req/min per IP (skip /health)");
console.log("📝 Structured Logging: Enabled");
console.log("🧠 LangGraph (with LLM): http://localhost:9000/api/langgraph/process");
console.log("🤖 LLM Agent (Direct): http://localhost:9000/api/agent/chat");
console.log("📦 Models: http://localhost:9000/api/models");
console.log("🔓 CORS: Enabled for all origins (*)");

export type App = typeof app;
