// Database schema
export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  source?: string;
  tags: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  senderId: string;
  pageId: string;
  messages: Message[];
  startedAt: Date;
  lastActivity: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  matchedKB?: string;
  confidence?: number;
}

export interface WebhookLog {
  id: string;
  pageId: string;
  senderId: string;
  rawPayload: any;
  processedAt: Date;
  response?: string;
}

export interface CrawlJob {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pagesCrawled: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}
