import type { AgentState } from "../state";
import { createLLM, getDefaultAgentConfig } from "../../agent/agent";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = "Bạn là trợ lý ảo thân thiện cho Facebook Page của cửa hàng. Hãy trả lời ngắn gọn, hữu ích và bằng tiếng Việt trừ khi khách hỏi bằng tiếng Anh.";

const GENERAL_RESPONSES = [
  "Cảm ơn bạn đã nhắn tin. Mình có thể giúp gì cho bạn?",
  "Mình đã nhận được tin nhắn của bạn. Bạn cần hỗ trợ thêm không?",
  "Dạ mình nghe đây ạ. Bạn cần mình giúp gì không?",
];

const HANDOFF_RESPONSE = "Dạ vấn đề của bạn cần sự hỗ trợ từ đội ngũ. Mình sẽ chuyển tin nhắn đến admin và họ sẽ liên hệ bạn sớm nhé!";

export async function generateResponseNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.response) {
    return { response: state.response };
  }
  
  if (state.needsHumanHandoff) {
    return {
      response: HANDOFF_RESPONSE,
      needsHumanHandoff: true,
    };
  }
  
  if (state.useLLM || state.intent === "general") {
    try {
      const config = getDefaultAgentConfig();
      const llm = createLLM(config);
      
      const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        ...state.messages,
        new HumanMessage(state.currentMessage),
      ];
      
      const result = await llm.invoke(messages);
      const response = result.content as string;
      
      return { response };
    } catch (error) {
      console.error("LLM call failed, falling back to rules:", error);
    }
  }
  
  const fallbackResponse = GENERAL_RESPONSES[
    Math.floor(Math.random() * GENERAL_RESPONSES.length)
  ];
  
  return { response: fallbackResponse };
}

export function handoffNode(_state: AgentState): Partial<AgentState> {
  return {
    response: HANDOFF_RESPONSE,
    needsHumanHandoff: true,
  };
}