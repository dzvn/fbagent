import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

import { orderDetectionTool, knowledgeSearchTool, saveConversationTool } from "../tools/order-detection";

export type ModelProvider = "openai" | "anthropic" | "ollama" | "custom" | "deepseek";

export interface AgentConfig {
  provider: ModelProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export function createLLM(config: AgentConfig): BaseChatModel {
  const { provider, model, apiKey, baseUrl, temperature = 0.7 } = config;
  
  switch (provider) {
    case "deepseek":
      return new ChatOpenAI({
        modelName: model || "deepseek-chat",
        openAIApiKey: apiKey || process.env.DEEPSEEK_API_KEY,
        configuration: { baseURL: baseUrl || "https://api.deepseek.com" },
        temperature
      });
    
    case "openai":
      return new ChatOpenAI({
        modelName: model || "gpt-4o-mini",
        openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
        temperature
      });
    
    case "anthropic":
      return new ChatAnthropic({
        model: model || "claude-3-5-sonnet-20241022",
        anthropicApiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        temperature
      });
    
    case "ollama":
      return new ChatOllama({
        model: model || "llama3.1",
        baseUrl: baseUrl || "http://localhost:11434",
        temperature
      });
    
    case "custom":
      return new ChatOpenAI({
        modelName: model || "custom-model",
        openAIApiKey: apiKey || "not-needed",
        configuration: { baseURL: baseUrl },
        temperature
      });
    
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Simple chat without tools - just LLM response
export async function chatWithLLM(config: AgentConfig, message: string, conversationHistory: string[] = []): Promise<string> {
  const llm = createLLM(config);
  
  const messages: BaseMessage[] = [
    new SystemMessage("Bạn là trợ lý ảo thân thiện cho Facebook Page của cửa hàng. Hãy trả lời ngắn gọn, hữu ích và bằng tiếng Việt trừ khi khách hỏi bằng tiếng Anh."),
    ...conversationHistory.map((msg, i) => new HumanMessage(msg)),
    new HumanMessage(message)
  ];
  
  const result = await llm.invoke(messages);
  return result.content as string;
}

export async function createAgent(config: AgentConfig) {
  const llm = createLLM(config);
  const tools = [orderDetectionTool, knowledgeSearchTool, saveConversationTool];
  
  // ReAct agent with tools (for future use)
  const { createReactAgent } = await import("@langchain/langgraph/prebuilt");
  const agent = createReactAgent({
    llm,
    tools,
    checkpointConfig: { configurable: { thread_id: "default" } }
  });
  
  return agent;
}

export function getDefaultAgentConfig(): AgentConfig {
  return {
    provider: (process.env.LLM_PROVIDER as ModelProvider) || "deepseek",
    model: process.env.LLM_MODEL || "deepseek-chat",
    apiKey: process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.LLM_BASE_URL || "https://api.deepseek.com",
    temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7")
  };
}
