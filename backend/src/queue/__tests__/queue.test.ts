/**
 * Queue Module Tests
 * Tests for Redis-based job queue implementation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import {
  enqueue,
  dequeue,
  getQueueLength,
  peekQueue,
  clearQueue,
  getPendingJobIds,
  getRedisClient,
  closeRedisClient
} from "../index";
import { JobType, MessageReplyPayload } from "../job-types";

describe("Queue Module", () => {
  beforeAll(async () => {
    // Ensure Redis client is initialized
    const client = getRedisClient();
    await client.ping();
  });

  afterAll(async () => {
    // Clean up and close connection
    await clearQueue(JobType.MESSAGE_REPLY);
    await clearQueue(JobType.CRAWL_JOB);
    await clearQueue(JobType.BATCH_IMPORT);
    await closeRedisClient();
  });

  beforeEach(async () => {
    // Clear queues before each test
    await clearQueue(JobType.MESSAGE_REPLY);
    await clearQueue(JobType.CRAWL_JOB);
    await clearQueue(JobType.BATCH_IMPORT);
  });

  describe("enqueue", () => {
    test("should enqueue a MESSAGE_REPLY job", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test_recipient_123",
        pageId: "test_page_456",
        messageText: "Hello from test!"
      };

      const job = await enqueue(JobType.MESSAGE_REPLY, payload);

      expect(job.id).toBeDefined();
      expect(job.type).toBe(JobType.MESSAGE_REPLY);
      expect(job.data.recipientId).toBe("test_recipient_123");
      expect(job.data.messageText).toBe("Hello from test!");
      expect(job.createdAt).toBeDefined();
      expect(job.retryCount).toBe(0);
      expect(job.maxRetries).toBe(3);
    });

    test("should enqueue with custom maxRetries", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test_recipient",
        pageId: "test_page",
        messageText: "Test message"
      };

      const job = await enqueue(JobType.MESSAGE_REPLY, payload, { maxRetries: 5 });

      expect(job.maxRetries).toBe(5);
    });

    test("should increase queue length after enqueue", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test",
        pageId: "test",
        messageText: "Test"
      };

      const initialLength = await getQueueLength(JobType.MESSAGE_REPLY);
      await enqueue(JobType.MESSAGE_REPLY, payload);
      const newLength = await getQueueLength(JobType.MESSAGE_REPLY);

      expect(newLength).toBe(initialLength + 1);
    });
  });

  describe("dequeue", () => {
    test("should dequeue a job in FIFO order", async () => {
      const firstPayload: MessageReplyPayload = {
        recipientId: "first",
        pageId: "test",
        messageText: "First message"
      };
      const secondPayload: MessageReplyPayload = {
        recipientId: "second",
        pageId: "test",
        messageText: "Second message"
      };

      await enqueue(JobType.MESSAGE_REPLY, firstPayload);
      await enqueue(JobType.MESSAGE_REPLY, secondPayload);

      const firstJob = await dequeue(JobType.MESSAGE_REPLY);
      const secondJob = await dequeue(JobType.MESSAGE_REPLY);

      // FIFO: first enqueued should be first dequeued
      expect(firstJob?.data.recipientId).toBe("first");
      expect(secondJob?.data.recipientId).toBe("second");
    });

    test("should return null when queue is empty", async () => {
      const job = await dequeue(JobType.MESSAGE_REPLY);
      expect(job).toBeNull();
    });

    test("should decrease queue length after dequeue", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test",
        pageId: "test",
        messageText: "Test"
      };

      await enqueue(JobType.MESSAGE_REPLY, payload);
      const lengthBeforeDequeue = await getQueueLength(JobType.MESSAGE_REPLY);
      await dequeue(JobType.MESSAGE_REPLY);
      const lengthAfterDequeue = await getQueueLength(JobType.MESSAGE_REPLY);

      expect(lengthAfterDequeue).toBe(lengthBeforeDequeue - 1);
    });
  });

  describe("getQueueLength", () => {
    test("should return 0 for empty queue", async () => {
      const length = await getQueueLength(JobType.MESSAGE_REPLY);
      expect(length).toBe(0);
    });

    test("should return correct count for multiple jobs", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test",
        pageId: "test",
        messageText: "Test"
      };

      await enqueue(JobType.MESSAGE_REPLY, payload);
      await enqueue(JobType.MESSAGE_REPLY, payload);
      await enqueue(JobType.MESSAGE_REPLY, payload);

      const length = await getQueueLength(JobType.MESSAGE_REPLY);
      expect(length).toBe(3);
    });
  });

  describe("peekQueue", () => {
    test("should peek at next job without removing it", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "peek_test",
        pageId: "test",
        messageText: "Peek message"
      };

      await enqueue(JobType.MESSAGE_REPLY, payload);

      const peekedJob = await peekQueue(JobType.MESSAGE_REPLY);
      const lengthAfterPeek = await getQueueLength(JobType.MESSAGE_REPLY);

      expect(peekedJob?.data.recipientId).toBe("peek_test");
      expect(lengthAfterPeek).toBe(1); // Job should still be in queue
    });

    test("should return null when queue is empty", async () => {
      const job = await peekQueue(JobType.MESSAGE_REPLY);
      expect(job).toBeNull();
    });
  });

  describe("clearQueue", () => {
    test("should clear all jobs from queue", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test",
        pageId: "test",
        messageText: "Test"
      };

      await enqueue(JobType.MESSAGE_REPLY, payload);
      await enqueue(JobType.MESSAGE_REPLY, payload);

      await clearQueue(JobType.MESSAGE_REPLY);

      const length = await getQueueLength(JobType.MESSAGE_REPLY);
      expect(length).toBe(0);
    });
  });

  describe("getPendingJobIds", () => {
    test("should return all pending job IDs", async () => {
      const payload: MessageReplyPayload = {
        recipientId: "test",
        pageId: "test",
        messageText: "Test"
      };

      const job1 = await enqueue(JobType.MESSAGE_REPLY, payload);
      const job2 = await enqueue(JobType.MESSAGE_REPLY, payload);

      const ids = await getPendingJobIds(JobType.MESSAGE_REPLY);

      expect(ids.length).toBe(2);
      expect(ids).toContain(job1.id);
      expect(ids).toContain(job2.id);
    });

    test("should return empty array for empty queue", async () => {
      const ids = await getPendingJobIds(JobType.MESSAGE_REPLY);
      expect(ids).toEqual([]);
    });
  });

  describe("Different job types", () => {
    test("should handle CRAWL_JOB type", async () => {
      const payload = {
        targetUrl: "https://example.com",
        depth: 2,
        tenantId: "tenant_123"
      };

      const job = await enqueue(JobType.CRAWL_JOB, payload);

      expect(job.type).toBe(JobType.CRAWL_JOB);
      expect(job.data.targetUrl).toBe("https://example.com");
    });

    test("should handle BATCH_IMPORT type", async () => {
      const payload = {
        source: "csv" as const,
        filePath: "/data/import.csv",
        tenantId: "tenant_123",
        options: { overwrite: true }
      };

      const job = await enqueue(JobType.BATCH_IMPORT, payload);

      expect(job.type).toBe(JobType.BATCH_IMPORT);
      expect(job.data.source).toBe("csv");
      expect(job.data.options?.overwrite).toBe(true);
    });

    test("should maintain separate queues per job type", async () => {
      await enqueue(JobType.MESSAGE_REPLY, {
        recipientId: "test",
        pageId: "test",
        messageText: "Test"
      });
      await enqueue(JobType.CRAWL_JOB, {
        targetUrl: "https://test.com",
        depth: 1,
        tenantId: "test"
      });

      const messageLength = await getQueueLength(JobType.MESSAGE_REPLY);
      const crawlLength = await getQueueLength(JobType.CRAWL_JOB);

      expect(messageLength).toBe(1);
      expect(crawlLength).toBe(1);
    });
  });
});