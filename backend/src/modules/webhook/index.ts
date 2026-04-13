import { Elysia, t } from "elysia";
import crypto from "crypto";

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "fbagent_verify_2026";
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || "";

export function verifyWebhook(mode: string, token: string, challenge: string): string {
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return challenge;
  }
  throw new Error("Webhook verification failed");
}

export function verifySignature(signature: string, payload: string): boolean {
  if (!PAGE_ACCESS_TOKEN) return true;
  const hash = crypto.createHmac("sha1", PAGE_ACCESS_TOKEN).update(payload).digest("hex");
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
      console.log(`[Webhook] Message from ${senderId} on page ${pageId}: ${text}`);
    }
  }
}

export const webhookRoutes = new Elysia()
  .post("/webhook", async ({ request, headers, body }) => {
    const signature = headers["x-hub-signature"] as string || "";
    const payload = await request.text();
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
