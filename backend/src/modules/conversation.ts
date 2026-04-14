import { Elysia, t } from "elysia";

const conversations: any[] = [];

export const conversationRoutes = new Elysia()
  .get("/api/conversations", () => ({ conversations, total: conversations.length }))
  .get("/api/conversations/:id", ({ params }: { params: any }) => {
    const conv = conversations.find(c => c.id === params.id);
    return conv || { error: "Not found" };
  })
  .post("/api/conversations", ({ body }: { body: any }) => {
    const conv = { id: `conv_${Date.now()}`, ...body, created_at: new Date(), messages: [] };
    conversations.push(conv);
    return { success: true, data: conv };
  }, {
    body: t.Object({ senderId: t.String(), pageId: t.String() })
  })
  .delete("/api/conversations/:id", ({ params }: { params: any }) => {
    const idx = conversations.findIndex(c => c.id === params.id);
    if (idx === -1) return { error: "Not found" };
    conversations.splice(idx, 1);
    return { success: true };
  })
  .post("/api/conversations/:sessionId/message", ({ params, body }: { params: any, body: any }) => {
    let conv = conversations.find(c => c.id === params.sessionId);
    if (!conv) {
      conv = { id: params.sessionId, messages: [], created_at: new Date() };
      conversations.push(conv);
    }
    const message = { id: `msg_${Date.now()}`, ...body, timestamp: new Date() };
    conv.messages.push(message);
    return { success: true, data: { message, conversation: conv } };
  })
  .get("/api/conversations/session/:sessionId", ({ params }: { params: any }) => {
    const conv = conversations.find(c => c.id === params.sessionId);
    return conv || { error: "Not found" };
  })
  .put("/api/conversations/:id", ({ params, body }: { params: any, body: any }) => {
    const idx = conversations.findIndex(c => c.id === params.id);
    if (idx === -1) return { error: "Not found" };
    conversations[idx] = { ...conversations[idx], ...body };
    return { success: true, data: conversations[idx] };
  });
