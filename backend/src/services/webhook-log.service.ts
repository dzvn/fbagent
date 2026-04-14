import { WebhookLog } from '../db/schema';
import { WebhookLogRepository, webhookLogRepo } from '../repositories/webhook-log.repository';

export class WebhookLogService {
  constructor(private repo: WebhookLogRepository = webhookLogRepo) {}

  async log(payload: {
    pageId: string;
    senderId: string;
    rawPayload: any;
    response?: string;
  }): Promise<WebhookLog> {
    return this.repo.log(payload);
  }

  async getBySender(senderId: string, limit = 50): Promise<WebhookLog[]> {
    return this.repo.findBySenderId(senderId, limit);
  }
}

export const defaultWebhookLogService = new WebhookLogService();
