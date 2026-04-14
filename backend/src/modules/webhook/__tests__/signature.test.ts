import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import crypto from "crypto";
import { verifySignature, verifyWebhook } from "../index";

describe("Webhook Signature Verification", () => {
  const originalSecret = process.env.FB_APP_SECRET;
  const testPayload = '{"object":"page","entry":[{"id":"123","time":1234567890}]}';
  const validSecret = "test_app_secret_12345";

  beforeEach(() => {
    process.env.FB_APP_SECRET = validSecret;
  });

  afterEach(() => {
    process.env.FB_APP_SECRET = originalSecret;
  });

  describe("verifySignature", () => {
    it("should return true for valid signature", () => {
      const hash = crypto.createHmac("sha1", validSecret).update(testPayload).digest("hex");
      const signature = `sha1=${hash}`;
      
      expect(verifySignature(signature, testPayload)).toBe(true);
    });

    it("should return false for invalid signature", () => {
      const invalidSignature = "sha1=invalid_hash_value";
      
      expect(verifySignature(invalidSignature, testPayload)).toBe(false);
    });

    it("should return false for wrong secret", () => {
      const hash = crypto.createHmac("sha1", "wrong_secret").update(testPayload).digest("hex");
      const signature = `sha1=${hash}`;
      
      expect(verifySignature(signature, testPayload)).toBe(false);
    });

    it("should return true in dev mode when FB_APP_SECRET is not set", () => {
      process.env.FB_APP_SECRET = "";
      const signature = "sha1=any_value";
      
      expect(verifySignature(signature, testPayload)).toBe(true);
    });

    it("should handle empty signature", () => {
      expect(verifySignature("", testPayload)).toBe(false);
    });

    it("should handle missing signature header", () => {
      expect(verifySignature(undefined as any, testPayload)).toBe(false);
    });
  });

  describe("verifyWebhook", () => {
    it("should return challenge token for valid subscription", () => {
      const mode = "subscribe";
      const token = "fbagent_verify_2026";
      const challenge = "challenge_abc123";
      
      const result = verifyWebhook(mode, token, challenge);
      
      expect(result).toBe(challenge);
    });

    it("should throw error for invalid mode", () => {
      expect(() => verifyWebhook("invalid", "token", "challenge")).toThrow("Webhook verification failed");
    });

    it("should throw error for mismatched verify token", () => {
      expect(() => verifyWebhook("subscribe", "wrong_token", "challenge")).toThrow("Webhook verification failed");
    });
  });
});
