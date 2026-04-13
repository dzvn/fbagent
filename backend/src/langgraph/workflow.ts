import { StateGraph, START, END } from "@langchain/langgraph";
import type { Annotation } from "@langchain/langgraph";

// Define state schema
const AgentState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  senderId: Annotation<string>,
  pageId: Annotation<string>,
  currentMessage: Annotation<string>,
  intent: Annotation<string | null>({ default: () => null }),
  orderDetected: Annotation<boolean>({ default: () => false }),
  orderInfo: Annotation<any>({ default: () => null }),
  response: Annotation<string | null>({ default: () => null }),
  needsHumanHandoff: Annotation<boolean>({ default: () => false })
});

type AgentStateType = typeof AgentState.State;

// Node: Classify intent
async function classifyIntent(state: AgentStateType) {
  const message = state.currentMessage.toLowerCase();
  
  // Simple rule-based intent classification (will replace with LLM)
  let intent = "general";
  
  if (["mua", "dat", "order", "lay", "can", "muon"].some(kw => message.includes(kw))) {
    intent = "order";
  } else if (["gia", "bao nhieu", "chi phi"].some(kw => message.includes(kw))) {
    intent = "pricing";
  } else if (["dia chi", "o dau", "vi tri"].some(kw => message.includes(kw))) {
    intent = "location";
  } else if (["gio mo cua", "may gio", "khi nao"].some(kw => message.includes(kw))) {
    intent = "hours";
  } else if (["doi tra", "bao hanh", "ket noi"].some(kw => message.includes(kw))) {
    intent = "support";
  } else if (["gap nguoi", "gap admin", "human", "staff"].some(kw => message.includes(kw))) {
    intent = "human_handoff";
  }
  
  return { intent };
}

// Node: Process order
async function processOrder(state: AgentStateType) {
  const message = state.currentMessage;
  
  // Extract phone number
  const phoneRegex = /(0[3-9]\d{8}|0[1-9]\d{8}|\+84\d{9})/;
  const phoneMatch = message.match(phoneRegex);
  
  if (!phoneMatch) {
    return {
      orderDetected: true,
      response: "Dạ mình thấy bạn muốn đặt hàng. Để mình hỗ trợ bạn, bạn vui lòng để lại số điện thoại nhé!",
      needsHumanHandoff: false
    };
  }
  
  return {
    orderDetected: true,
    orderInfo: { phone: phoneMatch[0], rawMessage: message },
    response: "Cảm ơn bạn! Mình đã nhận được thông tin. Số điện thoại: " + phoneMatch[0] + ". Bạn cần đặt sản phẩm nào ạ?",
    needsHumanHandoff: false
  };
}

// Node: Search knowledge base
async function searchKnowledge(state: AgentStateType) {
  try {
    const response = await fetch("http://localhost:9000/api/knowledge/search?q=" + encodeURIComponent(state.currentMessage));
    const results = await response.json();
    
    if (results && results.length > 0) {
      return {
        response: results[0].content,
        needsHumanHandoff: false
      };
    }
    
    return { needsHumanHandoff: true };
  } catch (error) {
    return { needsHumanHandoff: true };
  }
}

// Node: General response
async function generalResponse(state: AgentStateType) {
  const responses = [
    "Cảm ơn bạn đã nhắn tin. Mình có thể giúp gì cho bạn?",
    "Mình đã nhận được tin nhắn của bạn. Bạn cần hỗ trợ thêm không?",
    "Dạ mình nghe đây ạ. Bạn cần mình giúp gì không?"
  ];
  
  return {
    response: responses[Math.floor(Math.random() * responses.length)],
    needsHumanHandoff: false
  };
}

// Node: Human handoff
async function humanHandoff(state: AgentStateType) {
  return {
    response: "Dạ vấn đề của bạn cần sự hỗ trợ từ đội ngũ. Mình sẽ chuyển tin nhắn đến admin và họ sẽ liên hệ bạn sớm nhé!",
    needsHumanHandoff: true
  };
}

// Conditional edge router
function routeByIntent(state: AgentStateType): string {
  switch (state.intent) {
    case "order":
      return "processOrder";
    case "pricing":
    case "location":
    case "hours":
      return "searchKnowledge";
    case "human_handoff":
      return "humanHandoff";
    case "support":
      return "searchKnowledge";
    default:
      return "generalResponse";
  }
}

// Build workflow
export function buildAgentWorkflow() {
  const workflow = new StateGraph(AgentState)
    .addNode("classifyIntent", classifyIntent)
    .addNode("processOrder", processOrder)
    .addNode("searchKnowledge", searchKnowledge)
    .addNode("generalResponse", generalResponse)
    .addNode("humanHandoff", humanHandoff)
    .addEdge(START, "classifyIntent")
    .addConditionalEdges("classifyIntent", routeByIntent, {
      processOrder: "processOrder",
      searchKnowledge: "searchKnowledge",
      generalResponse: "generalResponse",
      humanHandoff: "humanHandoff"
    })
    .addEdge("processOrder", END)
    .addEdge("searchKnowledge", END)
    .addEdge("generalResponse", END)
    .addEdge("humanHandoff", END);
  
  return workflow.compile();
}
