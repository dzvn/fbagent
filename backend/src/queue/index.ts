/**
 * Redis-based Job Queue using ioredis
 * Simple FIFO queue implementation for Bun compatibility
 * 
 * Queue key format: fbagent:queue:{jobType}
 * Uses LPUSH for enqueue (push to left/head)
 * Uses RPOP for dequeue (pop from right/tail)
 */

import Redis from "ioredis";
import { randomUUID } from "crypto";
import { JobType, JobData, JobPayloadMap, MessageReplyPayload } from "./job-types";
import { createLogger } from "../middleware/logger";

export { JobType, JobData, JobPayloadMap, MessageReplyPayload };

const logger = createLogger("queue");

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6380";

// Queue key prefix
const QUEUE_KEY_PREFIX = "fbagent:queue";

/**
 * Get the Redis key for a specific job type queue
 */
function getQueueKey(jobType: JobType): string {
  return `${QUEUE_KEY_PREFIX}:${jobType}`;
}

/**
 * Redis client singleton
 * Lazy initialization for better Bun compatibility
 */
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error("Redis connection failed after 3 retries");
          return null;
        }
        const delay = Math.min(times * 100, 2000);
        logger.warn(`Redis reconnecting, attempt ${times}, delay ${delay}ms`);
        return delay;
      },
      lazyConnect: true
    });

    redisClient.on("connect", () => {
      logger.info("Redis client connected", { url: REDIS_URL });
    });

    redisClient.on("error", (err: Error) => {
      logger.error("Redis client error", {}, err);
    });

    redisClient.on("close", () => {
      logger.warn("Redis client connection closed");
    });
  }
  return redisClient;
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client closed");
  }
}

/**
 * Enqueue a job to the queue
 * Uses LPUSH to add job to the head of the list
 * 
 * @param jobType - Type of job to enqueue
 * @param data - Job payload data
 * @param options - Optional job configuration
 * @returns The created job data
 */
export async function enqueue<T extends JobType>(
  jobType: T,
  data: JobPayloadMap[T],
  options?: {
    maxRetries?: number;
  }
): Promise<JobData<JobPayloadMap[T]>> {
  const client = getRedisClient();
  
  const job: JobData<JobPayloadMap[T]> = {
    id: randomUUID(),
    type: jobType,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: options?.maxRetries ?? 3
  };

  const queueKey = getQueueKey(jobType);
  const jobJson = JSON.stringify(job);

  await client.lpush(queueKey, jobJson);

  logger.info("Job enqueued", {
    jobId: job.id,
    jobType,
    queueKey
  });

  return job;
}

/**
 * Dequeue a job from the queue
 * Uses RPOP to remove job from the tail of the list (FIFO order)
 * 
 * @param jobType - Type of job to dequeue
 * @returns The job data or null if queue is empty
 */
export async function dequeue<T extends JobType>(
  jobType: T
): Promise<JobData<JobPayloadMap[T]> | null> {
  const client = getRedisClient();
  
  const queueKey = getQueueKey(jobType);
  const result = await client.rpop(queueKey);

  if (!result) {
    return null;
  }

  try {
    const job = JSON.parse(result) as JobData<JobPayloadMap[T]>;
    logger.info("Job dequeued", {
      jobId: job.id,
      jobType,
      queueKey
    });
    return job;
  } catch (err) {
    logger.error("Failed to parse dequeued job", { rawResult: result }, err as Error);
    return null;
  }
}

/**
 * Get queue length for a specific job type
 * 
 * @param jobType - Type of job queue to check
 * @returns Number of jobs in the queue
 */
export async function getQueueLength(jobType: JobType): Promise<number> {
  const client = getRedisClient();
  const queueKey = getQueueKey(jobType);
  return await client.llen(queueKey);
}

/**
 * Peek at the next job without removing it
 * Uses LINDEX -1 to get the last element (next to be dequeued)
 * 
 * @param jobType - Type of job queue to peek
 * @returns The next job data or null if queue is empty
 */
export async function peekQueue<T extends JobType>(
  jobType: T
): Promise<JobData<JobPayloadMap[T]> | null> {
  const client = getRedisClient();
  const queueKey = getQueueKey(jobType);
  const result = await client.lindex(queueKey, -1);

  if (!result) {
    return null;
  }

  try {
    return JSON.parse(result) as JobData<JobPayloadMap[T]>;
  } catch (err) {
    logger.error("Failed to parse peeked job", { rawResult: result }, err as Error);
    return null;
  }
}

/**
 * Process a queue with a worker function
 * Continuously dequeues and processes jobs
 * 
 * @param jobType - Type of job queue to process
 * @param processor - Function to process each job
 * @param options - Processing options
 */
export async function processQueue<T extends JobType>(
  jobType: T,
  processor: (job: JobData<JobPayloadMap[T]>) => Promise<void>,
  options?: {
    interval?: number;
    batchSize?: number;
    onError?: (job: JobData<JobPayloadMap[T]>, error: Error) => Promise<void>;
  }
): Promise<void> {
  const interval = options?.interval ?? 1000;
  const batchSize = options?.batchSize ?? 1;

  logger.info("Queue processor started", {
    jobType,
    interval,
    batchSize
  });

  while (true) {
    try {
      // Process batch of jobs
      for (let i = 0; i < batchSize; i++) {
        const job = await dequeue(jobType);
        
        if (!job) {
          // Queue empty, wait before next check
          break;
        }

        try {
          await processor(job);
          logger.info("Job processed successfully", {
            jobId: job.id,
            jobType
          });
        } catch (err) {
          const error = err as Error;
          logger.error("Job processing failed", {
            jobId: job.id,
            jobType,
            retryCount: job.retryCount,
            maxRetries: job.maxRetries
          }, error);

          // Handle retry logic
          if (job.retryCount < job.maxRetries) {
            const retryJob: JobData<JobPayloadMap[T]> = {
              ...job,
              retryCount: job.retryCount + 1
            };
            await enqueue(jobType, retryJob.data, { maxRetries: retryJob.maxRetries });
            logger.info("Job re-enqueued for retry", {
              jobId: job.id,
              retryCount: retryJob.retryCount
            });
          } else if (options?.onError) {
            await options.onError(job, error);
          }
        }
      }

      // Wait before next polling cycle
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (err) {
      logger.error("Queue processor error", { jobType }, err as Error);
      // Continue processing despite errors
      await new Promise(resolve => setTimeout(resolve, interval * 2));
    }
  }
}

/**
 * Clear all jobs from a queue
 * 
 * @param jobType - Type of job queue to clear
 */
export async function clearQueue(jobType: JobType): Promise<void> {
  const client = getRedisClient();
  const queueKey = getQueueKey(jobType);
  await client.del(queueKey);
  logger.info("Queue cleared", { jobType, queueKey });
}

/**
 * Get all pending job IDs from a queue
 * 
 * @param jobType - Type of job queue
 * @returns Array of job IDs
 */
export async function getPendingJobIds(jobType: JobType): Promise<string[]> {
  const client = getRedisClient();
  const queueKey = getQueueKey(jobType);
  const length = await client.llen(queueKey);
  
  if (length === 0) {
    return [];
  }

  const jobs = await client.lrange(queueKey, 0, length - 1);
  return jobs.map((jobJson: string) => {
    try {
      const job = JSON.parse(jobJson) as JobData;
      return job.id;
    } catch {
      return "unknown";
    }
  });
}