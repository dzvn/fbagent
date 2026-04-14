/**
 * Job Types for Redis-based queue system
 * Simple FIFO queue using Redis lists (LPUSH/RPOP)
 */

export enum JobType {
  MESSAGE_REPLY = "MESSAGE_REPLY",
  CRAWL_JOB = "CRAWL_JOB",
  BATCH_IMPORT = "BATCH_IMPORT"
}

/**
 * Base job data structure
 */
export interface JobData<T = unknown> {
  id: string;
  type: JobType;
  data: T;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Message reply job payload
 */
export interface MessageReplyPayload {
  recipientId: string;
  pageId: string;
  messageText: string;
  pageAccessToken?: string;
}

/**
 * Crawl job payload
 */
export interface CrawlJobPayload {
  targetUrl: string;
  depth: number;
  tenantId: string;
}

/**
 * Batch import job payload
 */
export interface BatchImportPayload {
  source: "csv" | "json";
  filePath: string;
  tenantId: string;
  options?: {
    overwrite?: boolean;
    validate?: boolean;
  };
}

/**
 * Type mapping for job payloads
 */
export interface JobPayloadMap {
  [JobType.MESSAGE_REPLY]: MessageReplyPayload;
  [JobType.CRAWL_JOB]: CrawlJobPayload;
  [JobType.BATCH_IMPORT]: BatchImportPayload;
}

/**
 * Typed job data helper
 */
export type TypedJobData<T extends JobType> = JobData<JobPayloadMap[T]>;