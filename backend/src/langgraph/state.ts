import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Intent types for classification
 */
export type IntentType = 
  | "order" 
  | "pricing" 
  | "location" 
  | "hours" 
  | "support" 
  | "human_handoff" 
  | "general";

/**
 * Order information extracted from messages
 */
export interface OrderInfo {
  phone?: string;
  productName?: string;
  rawMessage?: string;
  needsMoreInfo?: boolean;
}

/**
 * Knowledge base search result
 */
export interface KBResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

/**
 * AgentState Annotation for LangGraph StateGraph
 */
export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (prev: BaseMessage[], next: BaseMessage[]) => [...prev, ...next],
  }),

  senderId: Annotation<string>({
    default: () => "",
  }),

  pageId: Annotation<string>({
    default: () => "",
  }),

  currentMessage: Annotation<string>({
    default: () => "",
  }),

  intent: Annotation<IntentType | null>({
    default: () => null,
  }),

  orderDetected: Annotation<boolean>({
    default: () => false,
  }),

  orderInfo: Annotation<OrderInfo | null>({
    default: () => null,
  }),

  kbResults: Annotation<KBResult[]>({
    default: () => [],
    reducer: (_prev: KBResult[], next: KBResult[]) => next,
  }),

  response: Annotation<string | null>({
    default: () => null,
  }),

  needsHumanHandoff: Annotation<boolean>({
    default: () => false,
  }),

  useLLM: Annotation<boolean>({
    default: () => true,
  }),

  conversationId: Annotation<string | null>({
    default: () => null,
  }),
});

/**
 * Type alias for AgentState
 */
export type AgentState = typeof AgentStateAnnotation.State;