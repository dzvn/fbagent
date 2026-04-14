import { Tenant, TenantConfig } from './tenant.repository';
import { LangGraphState, StateTransition } from './langgraph-state.repository';
import { KnowledgeBase, Conversation, Message, WebhookLog, CrawlJob } from '../db/schema';

type Entity = KnowledgeBase | Conversation | Message | WebhookLog | CrawlJob | Tenant | LangGraphState;

export interface BaseRepository<T extends Entity, InsertT extends Partial<T>> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: InsertT): Promise<T>;
  update(id: string, data: Partial<InsertT>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export abstract class AbstractBaseRepository<T extends Entity, InsertT extends Partial<T>> implements BaseRepository<T, InsertT> {
  protected db: any;

  constructor(db: any) {
    this.db = db;
  }

  abstract findAll(): Promise<T[]>;
  abstract findById(id: string): Promise<T | null>;
  abstract create(data: InsertT): Promise<T>;
  abstract update(id: string, data: Partial<InsertT>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}
