import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import { orderDetectionTool, knowledgeSearchTool, saveConversationTool } from "../tools/order-detection";

export type ModelProvider = "openai" | "anthropic" | "ollama" | "custom";

export interface AgentConfig {
  provider: ModelProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

// Create LLM based on config
export function createLLM(config: AgentConfig): BaseChatModel {
  const { provider, model, apiKey, baseUrl, temperature = 0.7 } = config;
  
  switch (provider) {
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
      // Custom OpenAI-compatible endpoint
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

// Create ReAct agent with tools
export async function createAgent(config: AgentConfig) {
  const llm = createLLM(config);
  const tools = [orderDetectionTool, knowledgeSearchTool, saveConversationTool];
  
  const agent = createReactAgent({
    llm,
    tools,
    checkpointConfig: { configurable: { thread_id: "default" } }
  });
  
  return agent;
}

// Default agent config from environment
export function getDefaultAgentConfig(): AgentConfig {
  return {
    provider: (process.env.LLM_PROVIDER as ModelProvider) || "openai",
    model: process.env.LLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL,
    temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7")
  };
}
