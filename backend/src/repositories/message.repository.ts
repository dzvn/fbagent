import { Message } from '../db/schema';
import { BaseRepository, AbstractBaseRepository } from './base.repository';

export type MessageInsert = Omit<Message, 'id' | 'timestamp'>;

export interface MessageRepository extends BaseRepository<Message, MessageInsert> {
  findByConversationId(conversationId: string): Promise<Message[]>;
  findByRole(conversationId: string, role: 'user' | 'assistant'): Promise<Message[]>;
  findLast(conversationId: string, limit: number): Promise<Message[]>;
}

export class MessageRepositoryImpl extends AbstractBaseRepository<Message, MessageInsert> implements MessageRepository {
  private storage: Map<string, Message> = new Map();
  private idCounter = 0;

  constructor(db: any) {
    super(db);
  }

  async findAll(): Promise<Message[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: string): Promise<Message | null> {
    return this.storage.get(id) || null;
  }

  async create(data: MessageInsert): Promise<Message> {
    const id = `msg_${++this.idCounter}`;
    const message: Message = {
      ...data,
      id,
      timestamp: new Date(),
    };
    this.storage.set(id, message);
    return message;
  }

  async update(id: string, data: Partial<MessageInsert>): Promise<Message | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated: Message = {
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

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return Array.from(this.storage.values()).filter((msg) => msg.conversationId === conversationId);
  }

  async findByRole(conversationId: string, role: 'user' | 'assistant'): Promise<Message[]> {
    return (await this.findByConversationId(conversationId)).filter((msg) => msg.role === role);
  }

  async findLast(conversationId: string, limit: number): Promise<Message[]> {
    const messages = await this.findByConversationId(conversationId);
    return messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const messageRepo = new MessageRepositoryImpl(null);
