/**
 * Facebook Graph API Service
 * Handles sending messages via Facebook Messenger API
 */

import { createLogger } from "../middleware/logger";

const logger = createLogger("facebook-service");

// Facebook Graph API configuration
const FB_API_VERSION = process.env.FB_API_VERSION || process.env.FB_GRAPH_API_VERSION || "v18.0";
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || "";

/**
 * Facebook Messenger API response
 */
interface FacebookApiResponse {
  recipient_id: string;
  message_id: string;
}

/**
 * Send result returned to callers
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  recipientId?: string;
  error?: string;
}

/**
 * FacebookService class
 * Provides methods to interact with Facebook Graph API
 */
export class FacebookService {
  private accessToken: string;
  private apiVersion: string;

  constructor(
    accessToken?: string,
    apiVersion?: string
  ) {
    this.accessToken = accessToken || FB_PAGE_ACCESS_TOKEN;
    this.apiVersion = apiVersion || FB_API_VERSION;
  }

  /**
   * Send a text message to a Facebook user
   * 
   * @param recipientId - Facebook user ID to send message to
   * @param text - Text message content
   * @returns SendMessageResult with success status and message ID or error
   */
  async sendMessage(recipientId: string, text: string): Promise<SendMessageResult> {
    if (!recipientId || recipientId.trim().length === 0) {
      return {
        success: false,
        error: "Recipient ID is required"
      };
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "Message text is required"
      };
    }

    if (!this.accessToken) {
      return {
        success: false,
        error: "Facebook Page Access Token not configured"
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/me/messages`;

    const body = {
      recipient: { id: recipientId },
      message: { text },
      access_token: this.accessToken
    };

    logger.info("Sending Facebook message", {
      recipientId,
      messageLength: text.length
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Facebook API error", {
          status: response.status,
          error: errorText,
          recipientId
        });

        return {
          success: false,
          error: `Facebook API error: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json() as FacebookApiResponse;

      logger.info("Facebook message sent successfully", {
        recipientId: result.recipient_id,
        messageId: result.message_id
      });

      return {
        success: true,
        messageId: result.message_id,
        recipientId: result.recipient_id
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      logger.error("Failed to send Facebook message", {
        recipientId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.accessToken && this.accessToken.length > 0);
  }

  /**
   * Get the current API version
   */
  getApiVersion(): string {
    return this.apiVersion;
  }
}

/**
 * Default Facebook service instance (singleton)
 * Uses environment variables for configuration
 */
export const facebookService = new FacebookService();