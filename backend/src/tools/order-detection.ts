import { tool } from "@langchain/core/tools";
import { z } from "zod";

export interface OrderItem {
  productName: string;
  quantity: number;
  price?: number;
}

export interface OrderInfo {
  customerName?: string;
  phone?: string;
  address?: string;
  items: OrderItem[];
  totalAmount?: number;
  notes?: string;
}

export const orderDetectionTool = tool(
  async (input: { message: string; conversationHistory: string[] }) => {
    const { message, conversationHistory } = input;
    const orderKeywords = ["mua", "dat", "order", "lay", "can", "muon", "toi muon", "toi can", "dang ky", "nhan"];
    const hasOrderIntent = orderKeywords.some(kw => message.toLowerCase().includes(kw));
    
    if (!hasOrderIntent) {
      return { hasOrder: false, confidence: 0, orderInfo: null };
    }
    
    const phoneRegex = /(0[3-9]\d{8}|0[1-9]\d{8}|\+84\d{9})/g;
    const phoneMatch = message.match(phoneRegex);
    
    return {
      hasOrder: true,
      confidence: 0.7,
      extractedData: {
        phone: phoneMatch?.[0] || null,
        rawMessage: message,
        keywords: orderKeywords.filter(kw => message.toLowerCase().includes(kw))
      },
      needsMoreInfo: !phoneMatch,
      missingFields: phoneMatch ? [] : ["phone"]
    };
  },
  {
    name: "detect_order",
    description: "Detect if customer wants to place an order and extract order information",
    schema: z.object({
      message: z.string().describe("Customer message to analyze"),
      conversationHistory: z.array(z.string()).describe("Previous messages")
    })
  }
);