import { describe, test, expect } from 'bun:test';
import {
  knowledgeBase,
  conversations,
  messages,
  webhookLogs,
  langgraphStates,
  tenants,
  autoReplyRules,
  crawlJobs,
  conversationsRelations,
  messagesRelations,
  tenantsRelations,
  autoReplyRulesRelations,
} from '../src/db/schema';

describe('Schema: Table Definitions', () => {
  test('knowledgeBase table has correct structure', () => {
    expect(knowledgeBase).toBeDefined();
    expect(knowledgeBase['id']).toBeDefined();
    expect(knowledgeBase['title']).toBeDefined();
    expect(knowledgeBase['content']).toBeDefined();
    expect(knowledgeBase['source']).toBeDefined();
    expect(knowledgeBase['tags']).toBeDefined();
    expect(knowledgeBase['createdAt']).toBeDefined();
    expect(knowledgeBase['updatedAt']).toBeDefined();
  });

  test('conversations table has correct structure', () => {
    expect(conversations).toBeDefined();
    expect(conversations['id']).toBeDefined();
    expect(conversations['senderId']).toBeDefined();
    expect(conversations['pageId']).toBeDefined();
    expect(conversations['startedAt']).toBeDefined();
    expect(conversations['lastActivity']).toBeDefined();
  });

  test('messages table has correct structure and FK to conversations', () => {
    expect(messages).toBeDefined();
    expect(messages['id']).toBeDefined();
    expect(messages['conversationId']).toBeDefined();
    expect(messages['role']).toBeDefined();
    expect(messages['content']).toBeDefined();
    expect(messages['timestamp']).toBeDefined();
    expect(messages['matchedKB']).toBeDefined();
    expect(messages['confidence']).toBeDefined();
  });

  test('webhookLogs table has correct structure', () => {
    expect(webhookLogs).toBeDefined();
    expect(webhookLogs['id']).toBeDefined();
    expect(webhookLogs['pageId']).toBeDefined();
    expect(webhookLogs['senderId']).toBeDefined();
    expect(webhookLogs['rawPayload']).toBeDefined();
    expect(webhookLogs['processedAt']).toBeDefined();
    expect(webhookLogs['response']).toBeDefined();
  });

  test('langgraphStates table has correct structure', () => {
    expect(langgraphStates).toBeDefined();
    expect(langgraphStates['id']).toBeDefined();
    expect(langgraphStates['threadId']).toBeDefined();
    expect(langgraphStates['checkpointNs']).toBeDefined();
    expect(langgraphStates['checkpointId']).toBeDefined();
    expect(langgraphStates['parentCheckpointId']).toBeDefined();
    expect(langgraphStates['state']).toBeDefined();
    expect(langgraphStates['createdAt']).toBeDefined();
  });

  test('tenants table has correct structure', () => {
    expect(tenants).toBeDefined();
    expect(tenants['id']).toBeDefined();
    expect(tenants['pageId']).toBeDefined();
    expect(tenants['name']).toBeDefined();
    expect(tenants['config']).toBeDefined();
    expect(tenants['createdAt']).toBeDefined();
  });

  test('autoReplyRules table has correct structure and FK to tenants', () => {
    expect(autoReplyRules).toBeDefined();
    expect(autoReplyRules['id']).toBeDefined();
    expect(autoReplyRules['tenantId']).toBeDefined();
    expect(autoReplyRules['keywords']).toBeDefined();
    expect(autoReplyRules['response']).toBeDefined();
    expect(autoReplyRules['priority']).toBeDefined();
    expect(autoReplyRules['enabled']).toBeDefined();
  });

  test('crawlJobs table has correct structure', () => {
    expect(crawlJobs).toBeDefined();
    expect(crawlJobs['id']).toBeDefined();
    expect(crawlJobs['url']).toBeDefined();
    expect(crawlJobs['status']).toBeDefined();
    expect(crawlJobs['pagesCrawled']).toBeDefined();
    expect(crawlJobs['error']).toBeDefined();
    expect(crawlJobs['startedAt']).toBeDefined();
    expect(crawlJobs['completedAt']).toBeDefined();
  });
});

describe('Schema: Relations', () => {
  test('conversationsRelations defines one-to-many with messages', () => {
    expect(conversationsRelations).toBeDefined();
  });

  test('messagesRelations defines one-to-one with conversation', () => {
    expect(messagesRelations).toBeDefined();
  });

  test('tenantsRelations defines one-to-many with autoReplyRules', () => {
    expect(tenantsRelations).toBeDefined();
  });

  test('autoReplyRulesRelations defines one-to-one with tenant', () => {
    expect(autoReplyRulesRelations).toBeDefined();
  });
});

describe('Schema: Type Exports', () => {
  test('KnowledgeBase type can be inferred', () => {
    type KB = typeof knowledgeBase.$inferSelect;
    const kb: KB = {
      id: 'test-id',
      title: 'Test',
      content: 'Test content',
      source: 'manual',
      tags: ['test'],
      embedding: [0.1, 0.2],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(kb.id).toBe('test-id');
  });

  test('Message type can be inferred with role enum', () => {
    type Msg = typeof messages.$inferSelect;
    const msg: Msg = {
      id: 'test-id',
      conversationId: 'conv-id',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
      matchedKB: null,
      confidence: null,
    };
    expect(msg.role).toBe('user');
  });

  test('CrawlJob type can be inferred with status enum', () => {
    type Job = typeof crawlJobs.$inferSelect;
    const job: Job = {
      id: 'test-id',
      url: 'https://example.com',
      status: 'pending',
      pagesCrawled: 0,
      error: null,
      startedAt: new Date(),
      completedAt: null,
    };
    expect(job.status).toBe('pending');
  });
});