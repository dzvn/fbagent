import { Elysia } from "elysia";
import { webhookRoutes } from "./modules/webhook";
import { knowledgeRoutes } from "./modules/knowledge";
import { autoReplyRoutes } from "./modules/auto-reply";
import { adminRoutes } from "./modules/admin";
import { buildAgentWorkflow } from "./langgraph/workflow";
import { createAgent, getDefaultAgentConfig, type AgentConfig } from "./agent/agent";
import { SUPPORTED_MODELS, getModelConfig } from "./config/models";

// Initialize LangGraph workflow
const agentWorkflow = buildAgentWorkflow();

// Agent config store
let currentAgentConfig: AgentConfig = getDefaultAgentConfig();
let agentModel: any = null;

// Process message with LangGraph
async function processWithLangGraph(message: string, senderId: string, pageId: string) {
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
      needsHumanHandoff: false
    });
    
    return {
      response: result.response || "Xin lỗi, mình chưa hiểu câu hỏi của bạn.",
      intent: result.intent,
      orderDetected: result.orderDetected,
      orderInfo: result.orderInfo,
      needsHumanHandoff: result.needsHumanHandoff,
      source: "langgraph"
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

// Process with LLM agent (ReAct)
async function processWithLLMAgent(message: string, conversationHistory: string[]) {
  if (!agentModel) {
    agentModel = await createAgent(currentAgentConfig);
  }
  
  try {
    const result = await agentModel.invoke({
      messages: [
        { role: "system", content: "Bạn là trợ lý ảo cho Facebook Page. Hãy trả lời thân thiện và hữu ích." },
        { role: "user", content: message }
      ]
    });
    
    return {
      response: result.content?.toString() || "Xin lỗi, mình chưa hiểu.",
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
  // CORS for all origins
  .onRequest(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS,PATCH";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With";
    set.headers["Access-Control-Allow-Credentials"] = "true";
    set.headers["Access-Control-Max-Age"] = "86400";
  })
  // Handle OPTIONS preflight
  .options("/*", () => {
    return { status: "ok" };
  })
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "fbagent-backend",
    version: "0.2.0-langgraph"
  }))
  
  // LangGraph endpoints
  .post("/api/langgraph/process", async ({ body }: { body: any }) => {
    const { message, senderId, pageId } = body;
    const result = await processWithLangGraph(message, senderId || "unknown", pageId || "unknown");
    return result;
  })
  
  // LLM Agent endpoints
  .post("/api/agent/chat", async ({ body }: { body: any }) => {
    const { message, conversationHistory = [] } = body;
    const result = await processWithLLMAgent(message, conversationHistory);
    return result;
  })
  
  // Model configuration
  .get("/api/models", () => ({
    models: SUPPORTED_MODELS,
    currentConfig: currentAgentConfig
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
    agentModel = null;
    return { success: true, config: currentAgentConfig };
  })
  
  .use(webhookRoutes)
  .use(knowledgeRoutes)
  .use(autoReplyRoutes)
  .use(adminRoutes)
  .listen(9000);

console.log("🚀 Backend running at http://localhost:9000");
console.log("🧠 LangGraph: http://localhost:9000/api/langgraph/process");
console.log("🤖 LLM Agent: http://localhost:9000/api/agent/chat");
console.log("📦 Models: http://localhost:9000/api/models");
console.log("🔓 CORS: Enabled for all origins (*)");

export type App = typeof app;
