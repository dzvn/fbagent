/**
 * Message Reply Processor
 * Processes MESSAGE_REPLY jobs and sends replies via Facebook Messenger API
 */

import { JobType, TypedJobData } from "../job-types";
import { createLogger } from "../../middleware/logger";

const logger = createLogger("message-reply-processor");

// Facebook Graph API configuration
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v18.0";
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || "";

/**
 * Facebook Messenger API response
 */
interface FacebookSendResponse {
  recipient_id: string;
  message_id: string;
}

/**
 * Send a message to Facebook Messenger
 * 
 * @param recipientId - Facebook user ID to send message to
 * @param messageText - Text message to send
 * @param pageAccessToken - Page access token (optional, uses env default)
 * @returns Facebook API response
 */
export async function sendFacebookMessage(
  recipientId: string,
  messageText: string,
  pageAccessToken?: string
): Promise<FacebookSendResponse> {
  const token = pageAccessToken || FB_PAGE_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error("Facebook Page Access Token not configured");
  }

  const url = `https://graph.facebook.com/${FB_GRAPH_API_VERSION}/me/messages`;
  
  const body = {
    recipient: { id: recipientId },
    message: { text: messageText },
    access_token: token
  };

  logger.info("Sending Facebook message", {
    recipientId,
    messageLength: messageText.length
  });

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
      error: errorText
    });
    throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json() as FacebookSendResponse;
  
  logger.info("Facebook message sent successfully", {
    recipientId: result.recipient_id,
    messageId: result.message_id
  });

  return result;
}

/**
 * Message Reply Processor class
 * Handles MESSAGE_REPLY job type processing
 */
export class MessageReplyProcessor {
  /**
   * Process a message reply job
   * 
   * @param job - The job to process
   */
  async process(job: TypedJobData<JobType.MESSAGE_REPLY>): Promise<void> {
    const { data } = job;
    const { recipientId, pageId, messageText, pageAccessToken } = data;

    logger.info("Processing message reply job", {
      jobId: job.id,
      recipientId,
      pageId
    });

    try {
      // Validate message text
      if (!messageText || messageText.trim().length === 0) {
        throw new Error("Message text is empty");
      }

      // Send message via Facebook API
      const result = await sendFacebookMessage(
        recipientId,
        messageText,
        pageAccessToken
      );

      logger.info("Message reply job completed", {
        jobId: job.id,
        recipientId: result.recipient_id,
        messageId: result.message_id
      });

    } catch (error) {
      logger.error("Message reply job failed", {
        jobId: job.id,
        recipientId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Handle job failure after max retries
   * 
   * @param job - The failed job
   * @param error - The error that caused failure
   */
  async handleFailure(
    job: TypedJobData<JobType.MESSAGE_REPLY>,
    error: Error
  ): Promise<void> {
    logger.error("Message reply job failed permanently", {
      jobId: job.id,
      recipientId: job.data.recipientId,
      retries: job.retryCount,
      error: error.message
    });

    // TODO: Implement failure handling:
    // - Log to database for audit
    // - Notify admin via notification service
    // - Mark conversation as needing manual intervention
  }
}

/**
 * Factory function to create processor instance
 */
export function createMessageReplyProcessor(): MessageReplyProcessor {
  return new MessageReplyProcessor();
}

/**
 * Default processor instance
 */
export const messageReplyProcessor = createMessageReplyProcessor();