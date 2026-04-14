/**
 * Background Worker for FB Agent
 * Processes queued jobs from Redis using ioredis-based queue
 */

import { processQueue, getRedisClient, closeRedisClient, getQueueLength } from "./queue";
import { JobType, TypedJobData } from "./queue/job-types";
import { MessageReplyProcessor, createMessageReplyProcessor } from "./queue/processors/message-reply.processor";
import { createLogger } from "./middleware/logger";

const logger = createLogger("worker");

let isRunning = true;
let shutdownInProgress = false;

const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL || "1000", 10);
const HEALTH_CHECK_INTERVAL = parseInt(process.env.WORKER_HEALTH_CHECK_INTERVAL || "30000", 10);

async function shutdown(signal: string): Promise<void> {
  if (shutdownInProgress) {
    logger.warn("Shutdown already in progress, ignoring signal", { signal });
    return;
  }

  shutdownInProgress = true;
  logger.info("Received shutdown signal, initiating graceful shutdown", { signal });

  isRunning = false;

  try {
    await closeRedisClient();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error("Error closing Redis connection", {}, error as Error);
  }

  logger.info("Worker shutdown complete", { signal });
  process.exit(0);
}

async function heartbeat(): Promise<void> {
  if (!isRunning) return;

  try {
    const redisClient = getRedisClient();
    const isConnected = redisClient.status === "ready";
    
    const messageReplyQueueLength = await getQueueLength(JobType.MESSAGE_REPLY);

    logger.info("Worker heartbeat", {
      redisStatus: isConnected ? "connected" : "disconnected",
      redisClientStatus: redisClient.status,
      messageReplyQueueLength,
      isRunning
    });
  } catch (error) {
    logger.error("Heartbeat check failed", {}, error as Error);
  }
}

async function runWorker(): Promise<void> {
  logger.info("Worker starting", {
    pollInterval: POLL_INTERVAL,
    healthCheckInterval: HEALTH_CHECK_INTERVAL,
    timestamp: new Date().toISOString()
  });

  const redisClient = getRedisClient();
  
  try {
    await redisClient.ping();
    logger.info("Redis connection established");
  } catch (error) {
    logger.error("Failed to connect to Redis", {}, error as Error);
    throw error;
  }

  const messageReplyProcessor = createMessageReplyProcessor();

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  const heartbeatTimer = setInterval(heartbeat, HEALTH_CHECK_INTERVAL);

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception in worker", {}, error);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection in worker", { 
      reason: String(reason),
      promise: String(promise)
    }, reason instanceof Error ? reason : undefined);
  });

  logger.info("Worker ready, processing MESSAGE_REPLY jobs");

  await processQueue(JobType.MESSAGE_REPLY, 
    async (job: TypedJobData<JobType.MESSAGE_REPLY>) => {
      if (!isRunning) {
        logger.info("Worker shutting down, stopping job processing", { jobId: job.id });
        return;
      }
      
      logger.info("Processing job", {
        jobId: job.id,
        jobType: job.type,
        retryCount: job.retryCount
      });

      await messageReplyProcessor.process(job);
    },
    {
      interval: POLL_INTERVAL,
      onError: async (job, error) => {
        await messageReplyProcessor.handleFailure(job, error);
      }
    }
  );

  clearInterval(heartbeatTimer);
  await closeRedisClient();
}

runWorker()
  .then(() => {
    logger.info("Worker exited normally");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Worker exited with error", {}, error);
    process.exit(1);
  });