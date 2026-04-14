// Webhook Log Repository
import { WebhookLog } from '../db/schema';
import { BaseRepository, AbstractBaseRepository } from './base.repository';

export type WebhookLogInsert = Omit<WebhookLog, 'id' | 'processedAt'>;

export interface WebhookLogRepository extends BaseRepository<WebhookLog, WebhookLogInsert> {
  findByPageId(pageId: string, limit?: number): Promise<WebhookLog[]>;
  findBySenderId(senderId: string, limit?: number): Promise<WebhookLog[]>;
  findRecent(limit?: number): Promise<WebhookLog[]>;
  log(payload: {
    pageId: string;
    senderId: string;
    rawPayload: any;
    response?: string;
  }): Promise<WebhookLog>;
}

export class WebhookLogRepositoryImpl extends AbstractBaseRepository<WebhookLog, WebhookLogInsert> implements WebhookLogRepository {
  private storage: Map<string, WebhookLog> = new Map();
  private idCounter = 0;

  constructor(db: any) {
    super(db);
  }

  async findAll(): Promise<WebhookLog[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: string): Promise<WebhookLog | null> {
    return this.storage.get(id) || null;
  }

  async create(data: WebhookLogInsert): Promise<WebhookLog> {
    const id = `log_${++this.idCounter}`;
    const log: WebhookLog = {
      ...data,
      id,
      processedAt: new Date(),
    };
    this.storage.set(id, log);
    return log;
  }

  async update(id: string, data: Partial<WebhookLogInsert>): Promise<WebhookLog | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated: WebhookLog = {
      ...existing,
      ...data,
      id,
    };
    this.storage.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async findByPageId(pageId: string, limit = 100): Promise<WebhookLog[]> {
    return Array.from(this.storage.values())
      .filter((log) => log.pageId === pageId)
      .slice(-limit);
  }

  async findBySenderId(senderId: string, limit = 50): Promise<WebhookLog[]> {
    return Array.from(this.storage.values())
      .filter((log) => log.senderId === senderId)
      .slice(-limit);
  }

  async findRecent(limit = 100): Promise<WebhookLog[]> {
    return Array.from(this.storage.values()).slice(-limit);
  }

  async log(payload: {
    pageId: string;
    senderId: string;
    rawPayload: any;
    response?: string;
  }): Promise<WebhookLog> {
    return this.create(payload);
  }
}

export const webhookLogRepo = new WebhookLogRepositoryImpl(null);

function getWebhookLogRepository(db?: any): WebhookLogRepository {
  return webhookLogRepo;
}
