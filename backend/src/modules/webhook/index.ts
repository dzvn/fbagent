import { Elysia, t } from "elysia";
import crypto from "crypto";
import { defaultMessageProcessorService } from "../../services/message-processor.service";
import { createLogger } from "../../middleware/logger";

const logger = createLogger("webhook");
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "fbagent_verify_2026";
const FB_APP_SECRET = process.env.FB_APP_SECRET || "";

export function verifyWebhook(mode: string, token: string, challenge: string): string {
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return challenge;
  }
  throw new Error("Webhook verification failed");
}

export function verifySignature(signature: string, payload: string): boolean {
  if (!FB_APP_SECRET) {
    logger.warn("FB_APP_SECRET not set - skipping signature verification (dev mode)");
    return true;
  }
  const hash = crypto.createHmac("sha1", FB_APP_SECRET).update(payload).digest("hex");
  return signature === `sha1=${hash}`;
}

export async function processMessage(payload: any) {
  const entry = payload.entry?.[0];
  if (!entry?.messaging) return;

  const messages = entry.messaging;
  for (const msg of messages) {
    if (msg.message?.text) {
      const senderId = msg.sender.id;
      const pageId = entry.id;
      const text = msg.message.text;

      const result = await defaultMessageProcessorService.processFacebookMessage(
        senderId,
        pageId,
        text,
        payload
      );

      await defaultMessageProcessorService.enqueueMessageReply(
        senderId,
        pageId,
        result.response
      );

      logger.info("Message processed and reply queued", {
        senderId,
        pageId,
        conversationId: result.conversationId,
        intent: result.intent,
        orderDetected: result.orderDetected
      });
    }
  }
}

export const webhookRoutes = new Elysia()
  .post("/webhook", async ({ request, headers, body }) => {
    const signature = headers["x-hub-signature"] as string || "";
    const payload = await request.text();
    
    if (!verifySignature(signature, payload)) {
      logger.warn("Invalid signature detected");
      return new Response("Invalid signature", { status: 403 });
    }
    
    const data = JSON.parse(payload);
    await processMessage(data);
    return { status: "ok" };
  }, {
    body: t.Any()
  })
  .get("/webhook", ({ query }: { query: Record<string, string> }) => {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];
    return verifyWebhook(mode, token, challenge);
  });
