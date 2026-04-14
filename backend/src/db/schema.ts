import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  source: text('source'),
  tags: jsonb('tags').$type<string[]>().default([]),
  embedding: jsonb('embedding').$type<number[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: text('page_id').notNull().unique(),
  name: text('name').notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pageIdIdx: index('tenants_page_id_idx').on(table.pageId),
}));

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: text('sender_id').notNull(),
  pageId: text('page_id').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  senderIdIdx: index('conversations_sender_id_idx').on(table.senderId),
  pageIdIdx: index('conversations_page_id_idx').on(table.pageId),
}));

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  matchedKB: text('matched_kb'),
  confidence: real('confidence'),
}, (table) => ({
  conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
}));

export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: text('page_id').notNull(),
  senderId: text('sender_id').notNull(),
  rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
  response: text('response'),
}, (table) => ({
  pageIdIdx: index('webhook_logs_page_id_idx').on(table.pageId),
  senderIdIdx: index('webhook_logs_sender_id_idx').on(table.senderId),
}));

export const langgraphStates = pgTable('langgraph_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: text('thread_id').notNull(),
  checkpointNs: text('checkpoint_ns').notNull(),
  checkpointId: text('checkpoint_id').notNull(),
  parentCheckpointId: text('parent_checkpoint_id'),
  state: jsonb('state').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  threadIdIdx: index('langgraph_states_thread_id_idx').on(table.threadId),
}));

export const autoReplyRules = pgTable('auto_reply_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  keywords: jsonb('keywords').$type<string[]>().notNull(),
  response: text('response').notNull(),
  priority: integer('priority').default(0).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
});

export const crawlJobs = pgTable('crawl_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: text('url').notNull(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull().default('pending'),
  pagesCrawled: integer('pages_crawled').default(0).notNull(),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  autoReplyRules: many(autoReplyRules),
}));

export const autoReplyRulesRelations = relations(autoReplyRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [autoReplyRules.tenantId],
    references: [tenants.id],
  }),
}));

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;

export type LanggraphState = typeof langgraphStates.$inferSelect;
export type InsertLanggraphState = typeof langgraphStates.$inferInsert;

export type AutoReplyRule = typeof autoReplyRules.$inferSelect;
export type InsertAutoReplyRule = typeof autoReplyRules.$inferInsert;

export type CrawlJob = typeof crawlJobs.$inferSelect;
export type InsertCrawlJob = typeof crawlJobs.$inferInsert;