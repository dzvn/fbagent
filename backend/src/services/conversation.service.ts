import { Conversation, Message } from '../db/schema';
import { ConversationRepository, conversationRepo } from '../repositories/conversation.repository';

export class ConversationService {
  constructor(private repo: ConversationRepository = conversationRepo) {}

  async getAll(): Promise<Conversation[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.repo.findById(id);
  }

  async getBySenderId(senderId: string): Promise<Conversation[]> {
    return this.repo.findBySenderId(senderId);
  }

  async createOrGet(senderId: string, pageId: string): Promise<Conversation> {
    const existing = await this.repo.findBySenderId(senderId);
    const activeConv = existing.find((c) => c.pageId === pageId);
    
    if (activeConv) {
      return activeConv;
    }
    
    return this.repo.create({ senderId, pageId });
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return this.repo.getMessages(conversationId, limit);
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    matchedKB?: string,
    confidence?: number
  ): Promise<Message> {
    return this.repo.addMessage(conversationId, {
      conversationId,
      role,
      content,
      matchedKB,
      confidence,
    });
  }
}

export const defaultConversationService = new ConversationService();
