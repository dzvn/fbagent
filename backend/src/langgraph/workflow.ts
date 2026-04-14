import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation, type AgentState } from "./state";
import { classifyNode, routeAfterClassify } from "./nodes/classify";
import { detectOrderNode } from "./nodes/detect-order";
import { searchKnowledgeNode } from "./nodes/search-knowledge";
import { generateResponseNode, handoffNode } from "./nodes/generate-response";

/**
 * Build and compile the LangGraph StateGraph workflow
 * 
 * Node flow:
 * START -> classify -> (conditional routing based on intent)
 *   - order -> detect_order -> END
 *   - pricing/location/hours/support -> search_knowledge -> generate_response -> END
 *   - human_handoff -> handoff -> END
 *   - general -> generate_response -> END
 */
export function buildAgentWorkflow() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode("classify", classifyNode)
    .addNode("detect_order", detectOrderNode)
    .addNode("search_knowledge", searchKnowledgeNode)
    .addNode("generate_response", generateResponseNode)
    .addNode("handoff", handoffNode)
    .addEdge(START, "classify")
    .addConditionalEdges("classify", routeAfterClassify, {
      detect_order: "detect_order",
      search_knowledge: "search_knowledge",
      handoff: "handoff",
      generate_response: "generate_response",
    })
    .addEdge("detect_order", END)
    .addEdge("search_knowledge", "generate_response")
    .addEdge("generate_response", END)
    .addEdge("handoff", END);
  
  return workflow.compile();
}

/**
 * Create initial state for workflow invocation
 */
export function createInitialState(
  senderId: string,
  pageId: string,
  message: string,
  useLLM = true,
  conversationId?: string
): Partial<AgentState> {
  return {
    messages: [],
    senderId,
    pageId,
    currentMessage: message,
    intent: null,
    orderDetected: false,
    orderInfo: null,
    kbResults: [],
    response: null,
    needsHumanHandoff: false,
    useLLM,
    conversationId: conversationId || null,
  };
}

/**
 * Process a message through the LangGraph workflow
 * Main entry point for the workflow
 */
export async function processMessage(
  senderId: string,
  pageId: string,
  message: string,
  useLLM = true,
  conversationId?: string
): Promise<{
  response: string;
  intent: string | null;
  orderDetected: boolean;
  orderInfo: any;
  needsHumanHandoff: boolean;
  source: string;
}> {
  const workflow = buildAgentWorkflow();
  const initialState = createInitialState(senderId, pageId, message, useLLM, conversationId);
  
  try {
    const result = await workflow.invoke(initialState);
    
    return {
      response: result.response || "Xin lỗi, mình chưa hiểu câu hỏi của bạn.",
      intent: result.intent,
      orderDetected: result.orderDetected || false,
      orderInfo: result.orderInfo,
      needsHumanHandoff: result.needsHumanHandoff || false,
      source: useLLM ? "llm-enhanced" : "langgraph",
    };
  } catch (error) {
    console.error("Workflow execution error:", error);
    return {
      response: "Xin lỗi, hiện tại mình đang gặp sự cố. Bạn thử lại sau nhé!",
      intent: null,
      orderDetected: false,
      orderInfo: null,
      needsHumanHandoff: true,
      source: "error",
    };
  }
}

export { buildAgentWorkflow as buildWorkflow };