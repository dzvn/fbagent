// Conversation Repository
import { Conversation, Message } from '../db/schema';
import { BaseRepository, AbstractBaseRepository } from './base.repository';

export type ConversationInsert = Omit<Conversation, 'id' | 'startedAt' | 'lastActivity' | 'messages'>;

export interface ConversationRepository extends BaseRepository<Conversation, ConversationInsert> {
  findBySenderId(senderId: string): Promise<Conversation[]>;
  getMessages(conversationId: string, limit?: number): Promise<Message[]>;
  addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message>;
  updateMessages(conversationId: string, messages: Message[]): Promise<Conversation | null>;
  getByIdAndSenderId(id: string, senderId: string): Promise<Conversation | null>;
}

export class ConversationRepositoryImpl extends AbstractBaseRepository<Conversation, ConversationInsert> implements ConversationRepository {
  private storage: Map<string, Conversation> = new Map();
  private idCounter = 0;

  constructor(db: any) {
    super(db);
  }

  async findAll(): Promise<Conversation[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.storage.get(id) || null;
  }

  async create(data: ConversationInsert): Promise<Conversation> {
    const id = `conv_${++this.idCounter}`;
    const conversation: Conversation = {
      ...data,
      id,
      messages: [],
      startedAt: new Date(),
      lastActivity: new Date(),
    };
    this.storage.set(id, conversation);
    return conversation;
  }

  async update(id: string, data: Partial<ConversationInsert>): Promise<Conversation | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated: Conversation = {
      ...existing,
      ...data,
      id,
      lastActivity: new Date(),
    };
    this.storage.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async findBySenderId(senderId: string): Promise<Conversation[]> {
    return Array.from(this.storage.values()).filter((c) => c.senderId === senderId);
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const conv = this.storage.get(conversationId);
    if (!conv) return [];
    return conv.messages.slice(-limit);
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message> {
    const conv = this.storage.get(conversationId);
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    conv.messages.push(newMessage);
    conv.lastActivity = new Date();
    this.storage.set(conversationId, conv);

    return newMessage;
  }

  async updateMessages(conversationId: string, messages: Message[]): Promise<Conversation | null> {
    const conv = this.storage.get(conversationId);
    if (!conv) return null;

    conv.messages = messages;
    conv.lastActivity = new Date();
    this.storage.set(conversationId, conv);
    return conv;
  }

  async getByIdAndSenderId(id: string, senderId: string): Promise<Conversation | null> {
    const conv = this.storage.get(id);
    return conv && conv.senderId === senderId ? conv : null;
  }
}

export const conversationRepo = new ConversationRepositoryImpl(null);

export type MessageInsert = Omit<Message, 'id' | 'timestamp'>;

function getConversationRepository(db?: any): ConversationRepository {
  return conversationRepo;
}
