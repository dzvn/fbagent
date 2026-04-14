import type { AgentState } from "../state";

const PHONE_REGEX = /(0[3-9]\d{8}|0[1-9]\d{8}|\+84\d{9})/g;

export function detectOrderNode(state: AgentState): Partial<AgentState> {
  const message = state.currentMessage;
  const phoneMatches = message.match(PHONE_REGEX);
  
  if (!phoneMatches) {
    return {
      orderDetected: true,
      orderInfo: {
        phone: undefined,
        rawMessage: message,
        needsMoreInfo: true,
      },
      response: "Dạ mình thấy bạn muốn đặt hàng. Để mình hỗ trợ bạn, bạn vui lòng để lại số điện thoại nhé!",
    };
  }
  
  const phone = phoneMatches[0];
  return {
    orderDetected: true,
    orderInfo: {
      phone,
      rawMessage: message,
      needsMoreInfo: false,
    },
    response: "Cảm ơn bạn! Mình đã nhận được thông tin. Số điện thoại: " + phone + ". Bạn cần đặt sản phẩm nào ạ?",
  };
}