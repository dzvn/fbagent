// Simple workflow implementation without complex StateGraph
export interface WorkflowState {
  messages: string[];
  senderId: string;
  pageId: string;
  currentMessage: string;
  intent: string | null;
  orderDetected: boolean;
  orderInfo: any;
  response: string | null;
  needsHumanHandoff: boolean;
}

export function createInitialstate(senderId: string, pageId: string, message: string): WorkflowState {
  return {
    messages: [],
    senderId,
    pageId,
    currentMessage: message,
    intent: null,
    orderDetected: false,
    orderInfo: null,
    response: null,
    needsHumanHandoff: false
  };
}

// Classify intent
function classifyIntent(message: string): string {
  const msg = message.toLowerCase();
  if (["mua", "dat", "order", "lay", "can", "muon"].some(kw => msg.includes(kw))) return "order";
  if (["gia", "bao nhieu", "chi phi"].some(kw => msg.includes(kw))) return "pricing";
  if (["dia chi", "o dau", "vi tri"].some(kw => msg.includes(kw))) return "location";
  if (["gio mo cua", "may gio", "khi nao"].some(kw => msg.includes(kw))) return "hours";
  if (["doi tra", "bao hanh", "ket noi"].some(kw => msg.includes(kw))) return "support";
  if (["gap nguoi", "gap admin", "human", "staff"].some(kw => msg.includes(kw))) return "human_handoff";
  return "general";
}

// Process order
function processOrder(message: string): { response: string; orderDetected: boolean; orderInfo: any } {
  const phoneRegex = /(0[3-9]\d{8}|0[1-9]\d{8}|\+84\d{9})/;
  const phoneMatch = message.match(phoneRegex);
  
  if (!phoneMatch) {
    return {
      orderDetected: true,
      response: "Dạ mình thấy bạn muốn đặt hàng. Để mình hỗ trợ bạn, bạn vui lòng để lại số điện thoại nhé!",
      orderInfo: null
    };
  }
  
  return {
    orderDetected: true,
    response: "Cảm ơn bạn! Mình đã nhận được thông tin. Số điện thoại: " + phoneMatch[0] + ". Bạn cần đặt sản phẩm nào ạ?",
    orderInfo: { phone: phoneMatch[0], rawMessage: message }
  };
}

// Search knowledge base
async function searchKnowledge(query: string): Promise<{ response: string | null; needsHumanHandoff: boolean }> {
  try {
    const response = await fetch("http://localhost:9000/api/knowledge/search?q=" + encodeURIComponent(query));
    const results = await response.json();
    if (results && results.length > 0) {
      return { response: results[0].content, needsHumanHandoff: false };
    }
    return { response: null, needsHumanHandoff: true };
  } catch (error) {
    return { response: null, needsHumanHandoff: true };
  }
}

// General response
function generalResponse(): string {
  const responses = [
    "Cảm ơn bạn đã nhắn tin. Mình có thể giúp gì cho bạn?",
    "Mình đã nhận được tin nhắn của bạn. Bạn cần hỗ trợ thêm không?",
    "Dạ mình nghe đây ạ. Bạn cần mình giúp gì không?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Human handoff
function humanHandoff(): string {
  return "Dạ vấn đề của bạn cần sự hỗ trợ từ đội ngũ. Mình sẽ chuyển tin nhắn đến admin và họ sẽ liên hệ bạn sớm nhé!";
}

// Main workflow processor
export async function processWorkflow(state: WorkflowState): Promise<WorkflowState> {
  // Step 1: Classify intent
  state.intent = classifyIntent(state.currentMessage);
  
  // Step 2: Route by intent
  switch (state.intent) {
    case "order": {
      const result = processOrder(state.currentMessage);
      state.orderDetected = result.orderDetected;
      state.orderInfo = result.orderInfo;
      state.response = result.response;
      break;
    }
    case "pricing":
    case "location":
    case "hours":
    case "support": {
      const result = await searchKnowledge(state.currentMessage);
      state.response = result.response || generalResponse();
      state.needsHumanHandoff = result.needsHumanHandoff;
      break;
    }
    case "human_handoff": {
      state.response = humanHandoff();
      state.needsHumanHandoff = true;
      break;
    }
    default: {
      state.response = generalResponse();
      break;
    }
  }
  
  return state;
}

// Simple compile function (returns the processor)
export function buildAgentWorkflow() {
  return {
    invoke: async (input: Partial<WorkflowState> & { currentMessage: string; senderId: string; pageId: string }) => {
      const state = createInitialstate(input.senderId, input.pageId, input.currentMessage);
      return await processWorkflow(state);
    }
  };
}
