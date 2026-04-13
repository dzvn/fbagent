import { Elysia, t } from "elysia";

interface ReplyRule {
  id: string;
  keywords: string[];
  response: string;
  priority: number;
  enabled: boolean;
}

const replyRules: ReplyRule[] = [
  {
    id: "rule_1",
    keywords: ["chào", "hi", "hello", "xin chào"],
    response: "Chào bạn! Mình là trợ lý tự động. Mình có thể giúp gì cho bạn hôm nay?",
    priority: 10,
    enabled: true
  },
  {
    id: "rule_2",
    keywords: ["giá", "bao nhiêu", "chi phí"],
    response: "Dạ về giá cả, bạn có thể xem chi tiết trên website hoặc để lại thông tin, mình sẽ gửi báo giá cụ thể nhé!",
    priority: 5,
    enabled: true
  },
  {
    id: "rule_3",
    keywords: ["địa chỉ", "ở đâu", "vị trí"],
    response: "Địa chỉ của chúng mình: [Thêm địa chỉ của bạn]. Bạn cần hỗ trợ thêm không ạ?",
    priority: 5,
    enabled: true
  },
  {
    id: "rule_4",
    keywords: ["giờ mở cửa", "mấy giờ", "khi nào"],
    response: "Giờ mở cửa: Thứ 2 - Chủ Nhật, 8:00 - 22:00. Rất hân hạnh được đón tiếp bạn!",
    priority: 5,
    enabled: true
  }
];

function findMatchingRule(message: string): ReplyRule | null {
  const msgLower = message.toLowerCase();
  const matches = replyRules.filter(rule => 
    rule.enabled && rule.keywords.some(kw => msgLower.includes(kw.toLowerCase()))
  );
  
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.priority - a.priority)[0];
}

export function generateReply(message: string, kbResults?: any[]): {
  response: string;
  source: "rule" | "kb" | "fallback";
  confidence: number;
} {
  const rule = findMatchingRule(message);
  if (rule) {
    return {
      response: rule.response,
      source: "rule",
      confidence: 0.9
    };
  }
  
  if (kbResults && kbResults.length > 0) {
    const best = kbResults[0];
    if (best.score >= 2) {
      return {
        response: best.content,
        source: "kb",
        confidence: Math.min(best.score / 5, 0.95)
      };
    }
  }
  
  return {
    response: "Cảm ơn bạn đã nhắn tin. Hiện tại mình chưa hiểu rõ câu hỏi của bạn. Bạn có thể diễn đạt chi tiết hơn hoặc để lại số điện thoại, team mình sẽ liên hệ hỗ trợ sớm nhé!",
    source: "fallback",
    confidence: 0.3
  };
}

export const autoReplyRoutes = new Elysia()
  .post("/api/auto-reply", ({ body }: { body: any }) => {
    const { message, kbResults } = body;
    const reply = generateReply(message, kbResults);
    return reply;
  }, {
    body: t.Object({
      message: t.String(),
      kbResults: t.Optional(t.Array(t.Any()))
    })
  })
  .get("/api/auto-reply/rules", () => {
    return replyRules;
  })
  .post("/api/auto-reply/rules", ({ body }: { body: any }) => {
    const rule: ReplyRule = {
      id: `rule_${Date.now()}`,
      keywords: body.keywords,
      response: body.response,
      priority: body.priority || 1,
      enabled: body.enabled !== false
    };
    replyRules.push(rule);
    return { success: true, data: rule };
  }, {
    body: t.Object({
      keywords: t.Array(t.String()),
      response: t.String(),
      priority: t.Optional(t.Number()),
      enabled: t.Optional(t.Boolean())
    })
  });
