import { createLogger } from '../middleware/logger';
import { defaultConversationService, ConversationService } from './conversation.service';
import { defaultWebhookLogService, WebhookLogService } from './webhook-log.service';
import { buildAgentWorkflow } from '../langgraph/workflow';
import { enqueue, JobType, MessageReplyPayload } from '../queue';

const logger = createLogger('message-processor');

export interface ProcessFacebookMessageResult {
  response: string;
  conversationId: string;
  intent: string | null;
  orderDetected: boolean;
  needsHumanHandoff: boolean;
}

export class MessageProcessorService {
  private agentWorkflow = buildAgentWorkflow();

  constructor(
    private conversationService: ConversationService = defaultConversationService,
    private webhookLogService: WebhookLogService = defaultWebhookLogService
  ) {}

  async processFacebookMessage(
    senderId: string,
    pageId: string,
    text: string,
    payload: any
  ): Promise<ProcessFacebookMessageResult> {
    logger.info('Processing Facebook message', {
      senderId,
      pageId,
      messageLength: text.length
    });

    await this.webhookLogService.log({
      pageId,
      senderId,
      rawPayload: payload
    });

    const conversation = await this.conversationService.createOrGet(senderId, pageId);

    await this.conversationService.addMessage(
      conversation.id,
      'user',
      text
    );

    const workflowResult = await this.agentWorkflow.invoke({
      senderId,
      pageId,
      currentMessage: text,
      useLLM: true
    });

    const response = workflowResult.response || 'Xin lỗi, mình chưa hiểu câu hỏi của bạn.';

    await this.conversationService.addMessage(
      conversation.id,
      'assistant',
      response
    );

    logger.info('Message processing completed', {
      conversationId: conversation.id,
      intent: workflowResult.intent,
      orderDetected: workflowResult.orderDetected,
      needsHumanHandoff: workflowResult.needsHumanHandoff
    });

    return {
      response,
      conversationId: conversation.id,
      intent: workflowResult.intent,
      orderDetected: workflowResult.orderDetected,
      needsHumanHandoff: workflowResult.needsHumanHandoff
    };
  }

  async enqueueMessageReply(
    recipientId: string,
    pageId: string,
    messageText: string
  ): Promise<void> {
    const replyPayload: MessageReplyPayload = {
      recipientId,
      pageId,
      messageText
    };

    await enqueue(JobType.MESSAGE_REPLY, replyPayload);

    logger.info('Reply job enqueued', {
      recipientId,
      pageId
    });
  }
}

export const defaultMessageProcessorService = new MessageProcessorService();