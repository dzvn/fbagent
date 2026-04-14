/**
 * Facebook Service Tests
 */

import { describe, test, expect, beforeEach, mock, afterEach } from "bun:test";
import { FacebookService, SendMessageResult } from "../facebook.service";

describe("FacebookService", () => {
  const mockAccessToken = "test_page_access_token";
  const mockApiVersion = "v18.0";
  const mockRecipientId = "123456789";
  const mockMessageText = "Hello from Facebook Agent!";

  let service: FacebookService;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    service = new FacebookService(mockAccessToken, mockApiVersion);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("sendMessage", () => {
    test("should send message successfully and return success result", async () => {
      const mockMessageId = "mid.test_message_id";
      const mockResponse = {
        recipient_id: mockRecipientId,
        message_id: mockMessageId
      };

      global.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve("")
        } as Response)
      );

      const result = await service.sendMessage(mockRecipientId, mockMessageText);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(mockMessageId);
      expect(result.recipientId).toBe(mockRecipientId);
      expect(result.error).toBeUndefined();
    });

    test("should call Facebook Graph API with correct URL and body", async () => {
      let capturedUrl: string | undefined;
      let capturedBody: string | undefined;

      global.fetch = mock((url: string, options: any) => {
        capturedUrl = url;
        capturedBody = options.body;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            recipient_id: mockRecipientId,
            message_id: "mid.test"
          }),
          text: () => Promise.resolve("")
        } as Response);
      });

      await service.sendMessage(mockRecipientId, mockMessageText);

      expect(capturedUrl).toBe(`https://graph.facebook.com/${mockApiVersion}/me/messages`);
      
      const parsedBody = JSON.parse(capturedBody as string);
      expect(parsedBody.recipient.id).toBe(mockRecipientId);
      expect(parsedBody.message.text).toBe(mockMessageText);
      expect(parsedBody.access_token).toBe(mockAccessToken);
    });

    test("should return error when Facebook API returns non-OK status", async () => {
      const errorStatus = 400;
      const errorText = "Invalid OAuth access token";

      global.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: errorStatus,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(errorText)
        } as Response)
      );

      const result = await service.sendMessage(mockRecipientId, mockMessageText);

      expect(result.success).toBe(false);
      expect(result.messageId).toBeUndefined();
      expect(result.error).toContain(`${errorStatus}`);
      expect(result.error).toContain(errorText);
    });

    test("should return error when recipient ID is empty", async () => {
      const result = await service.sendMessage("", mockMessageText);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Recipient ID is required");
    });

    test("should return error when recipient ID is whitespace only", async () => {
      const result = await service.sendMessage("   ", mockMessageText);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Recipient ID is required");
    });

    test("should return error when message text is empty", async () => {
      const result = await service.sendMessage(mockRecipientId, "");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Message text is required");
    });

    test("should return error when message text is whitespace only", async () => {
      const result = await service.sendMessage(mockRecipientId, "   ");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Message text is required");
    });

    test("should return error when access token is not configured", async () => {
      const unconfiguredService = new FacebookService("", mockApiVersion);

      const result = await unconfiguredService.sendMessage(mockRecipientId, mockMessageText);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Facebook Page Access Token not configured");
    });

    test("should handle network errors gracefully", async () => {
      global.fetch = mock(() =>
        Promise.reject(new Error("Network connection failed"))
      );

      const result = await service.sendMessage(mockRecipientId, mockMessageText);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network connection failed");
    });

    test("should handle unexpected error types", async () => {
      global.fetch = mock(() =>
        Promise.reject("Unknown error string")
      );

      const result = await service.sendMessage(mockRecipientId, mockMessageText);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });

  describe("isConfigured", () => {
    test("should return true when access token is set", () => {
      const configuredService = new FacebookService("valid_token", mockApiVersion);
      expect(configuredService.isConfigured()).toBe(true);
    });

    test("should return false when access token is empty", () => {
      const unconfiguredService = new FacebookService("", mockApiVersion);
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe("getApiVersion", () => {
    test("should return the configured API version", () => {
      expect(service.getApiVersion()).toBe(mockApiVersion);
    });

    test("should return default version when not specified", () => {
      const defaultService = new FacebookService(mockAccessToken);
      expect(defaultService.getApiVersion()).toBe("v18.0");
    });
  });
});

describe("facebookService singleton", () => {
  test("should be exported as singleton instance", async () => {
    const { facebookService } = await import("../facebook.service");
    expect(facebookService).toBeDefined();
    expect(facebookService instanceof FacebookService).toBe(true);
  });
});