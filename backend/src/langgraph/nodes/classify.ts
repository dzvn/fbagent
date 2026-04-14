import type { AgentState, IntentType } from "../state";

/**
 * Intent classification keywords mapping
 */
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  order: ["mua", "dat", "order", "lay", "can", "muon", "buy", "purchase", "need", "want", "id like"],
  pricing: ["gia", "bao nhieu", "chi phi", "price", "cost", "how much"],
  location: ["dia chi", "o dau", "vi tri", "address", "where", "location"],
  hours: ["gio mo cua", "may gio", "khi nao", "hours", "open", "close", "when"],
  support: ["doi tra", "bao hanh", "ket noi", "return", "warranty", "support", "refund"],
  human_handoff: ["gap nguoi", "gap admin", "human", "staff", "agent", "support team"],
  general: [],
};

/**
 * Classify message intent based on keyword matching
 * This is the classify node in the LangGraph workflow
 */
export function classifyNode(state: AgentState): Partial<AgentState> {
  const message = state.currentMessage.toLowerCase();
  
  // Check each intent type for keyword matches
  for (const [intentType, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intentType === "general") continue;
    
    if (keywords.some((kw) => message.includes(kw))) {
      return {
        intent: intentType as IntentType,
      };
    }
  }
  
  // Default to general if no keywords matched
  return {
    intent: "general",
  };
}

/**
 * Routing function after classify node
 * Determines which node to go to based on intent
 */
export function routeAfterClassify(state: AgentState): string {
  const intent = state.intent;
  
  switch (intent) {
    case "order":
      return "detect_order";
    case "pricing":
    case "location":
    case "hours":
    case "support":
      return "search_knowledge";
    case "human_handoff":
      return "handoff";
    default:
      return "generate_response";
  }
}