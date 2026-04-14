import type { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseCheckpointSaver,
  type Checkpoint,
  type CheckpointTuple,
  type CheckpointMetadata,
  type CheckpointListOptions,
  type ChannelVersions,
  type PendingWrite,
} from '@langchain/langgraph';
import { eq, and, desc, lt } from 'drizzle-orm';
import { db, langgraphStates } from '../db';
import type { InsertLanggraphState } from '../db/schema';

/**
 * PostgreSQL-based checkpointer for LangGraph state persistence.
 * Implements BaseCheckpointSaver interface to store checkpoints in PostgreSQL.
 */
export class PostgresSaver extends BaseCheckpointSaver {
  /**
   * Get a checkpoint tuple from storage.
   * Retrieves the most recent checkpoint for a thread, or a specific checkpoint by ID.
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns as string ?? '';
    const checkpointId = config.configurable?.checkpoint_id as string;

    if (!threadId) {
      return undefined;
    }

    const conditions = [
      eq(langgraphStates.threadId, threadId),
      eq(langgraphStates.checkpointNs, checkpointNs),
    ];

    if (checkpointId) {
      conditions.push(eq(langgraphStates.checkpointId, checkpointId));
    }

    const results = await db
      .select()
      .from(langgraphStates)
      .where(and(...conditions))
      .orderBy(desc(langgraphStates.createdAt))
      .limit(1);

    if (results.length === 0) {
      return undefined;
    }

    const row = results[0];
    const stateData = row.state as {
      checkpoint?: Checkpoint;
      metadata?: CheckpointMetadata;
      pendingWrites?: Array<[string, string, unknown]>;
    };

    if (!stateData.checkpoint) {
      return undefined;
    }

    return {
      config: {
        configurable: {
          thread_id: row.threadId,
          checkpoint_ns: row.checkpointNs,
          checkpoint_id: row.checkpointId,
        },
      },
      checkpoint: stateData.checkpoint,
      metadata: stateData.metadata,
      parentConfig: row.parentCheckpointId
        ? {
            configurable: {
              thread_id: row.threadId,
              checkpoint_ns: row.checkpointNs,
              checkpoint_id: row.parentCheckpointId,
            },
          }
        : undefined,
      pendingWrites: stateData.pendingWrites?.map(([taskId, channel, value]) => [
        taskId,
        channel,
        value,
      ]),
    };
  }

  /**
   * List all checkpoints for a given thread.
   * Supports filtering by limit and before checkpoint.
   */
  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns as string ?? '';
    const limit = options?.limit ?? 10;
    const beforeCheckpointId = options?.before?.configurable?.checkpoint_id as string;

    if (!threadId) {
      return;
    }

    const conditions = [
      eq(langgraphStates.threadId, threadId),
      eq(langgraphStates.checkpointNs, checkpointNs),
    ];

    if (beforeCheckpointId) {
      conditions.push(lt(langgraphStates.createdAt, beforeCheckpointId));
    }

    const results = await db
      .select()
      .from(langgraphStates)
      .where(and(...conditions))
      .orderBy(desc(langgraphStates.createdAt))
      .limit(limit);

    for (const row of results) {
      const stateData = row.state as {
        checkpoint?: Checkpoint;
        metadata?: CheckpointMetadata;
        pendingWrites?: Array<[string, string, unknown]>;
      };

      if (stateData.checkpoint) {
        yield {
          config: {
            configurable: {
              thread_id: row.threadId,
              checkpoint_ns: row.checkpointNs,
              checkpoint_id: row.checkpointId,
            },
          },
          checkpoint: stateData.checkpoint,
          metadata: stateData.metadata,
          parentConfig: row.parentCheckpointId
            ? {
                configurable: {
                  thread_id: row.threadId,
                  checkpoint_ns: row.checkpointNs,
                  checkpoint_id: row.parentCheckpointId,
                },
              }
            : undefined,
          pendingWrites: stateData.pendingWrites?.map(([taskId, channel, value]) => [
            taskId,
            channel,
            value,
          ]),
        };
      }
    }
  }

  /**
   * Store a checkpoint with its configuration and metadata.
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns as string ?? '';
    const parentCheckpointId = config.configurable?.checkpoint_id as string;
    const checkpointId = checkpoint.id;

    if (!threadId) {
      throw new Error('thread_id is required in config.configurable');
    }

    const existing = await db
      .select()
      .from(langgraphStates)
      .where(
        and(
          eq(langgraphStates.threadId, threadId),
          eq(langgraphStates.checkpointNs, checkpointNs),
          eq(langgraphStates.checkpointId, checkpointId)
        )
      )
      .limit(1);

    const stateData: Record<string, unknown> = {
      checkpoint,
      metadata,
      newVersions,
      pendingWrites: [],
    };

    if (existing.length > 0) {
      await db
        .update(langgraphStates)
        .set({
          state: stateData,
          parentCheckpointId: parentCheckpointId ?? null,
        })
        .where(
          and(
            eq(langgraphStates.threadId, threadId),
            eq(langgraphStates.checkpointNs, checkpointNs),
            eq(langgraphStates.checkpointId, checkpointId)
          )
        );
    } else {
      const insertData: InsertLanggraphState = {
        threadId,
        checkpointNs,
        checkpointId,
        parentCheckpointId: parentCheckpointId ?? null,
        state: stateData,
      };

      await db.insert(langgraphStates).values(insertData);
    }

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
      },
    };
  }

  /**
   * Store intermediate writes linked to a checkpoint.
   * Pending writes are stored within the checkpoint's state JSONB.
   */
  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string
  ): Promise<void> {
    const threadId = config.configurable?.thread_id as string;
    const checkpointNs = config.configurable?.checkpoint_ns as string ?? '';
    const checkpointId = config.configurable?.checkpoint_id as string;

    if (!threadId || !checkpointId) {
      throw new Error('thread_id and checkpoint_id are required in config.configurable');
    }

    const existing = await db
      .select()
      .from(langgraphStates)
      .where(
        and(
          eq(langgraphStates.threadId, threadId),
          eq(langgraphStates.checkpointNs, checkpointNs),
          eq(langgraphStates.checkpointId, checkpointId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error(`Checkpoint not found: thread_id=${threadId}, checkpoint_id=${checkpointId}`);
    }

    const row = existing[0];
    const stateData = row.state as {
      checkpoint?: Checkpoint;
      metadata?: CheckpointMetadata;
      pendingWrites?: Array<[string, string, unknown]>;
      newVersions?: ChannelVersions;
    };

    const pendingWrites = stateData.pendingWrites ?? [];

    for (const write of writes) {
      const [channel, value] = write;
      pendingWrites.push([taskId, channel, value]);
    }

    const updatedState = {
      ...stateData,
      pendingWrites,
    };

    await db
      .update(langgraphStates)
      .set({ state: updatedState })
      .where(
        and(
          eq(langgraphStates.threadId, threadId),
          eq(langgraphStates.checkpointNs, checkpointNs),
          eq(langgraphStates.checkpointId, checkpointId)
        )
      );
  }

  /**
   * Delete all checkpoints associated with a thread ID.
   */
  async deleteThread(threadId: string): Promise<void> {
    if (!threadId) {
      return;
    }

    await db
      .delete(langgraphStates)
      .where(eq(langgraphStates.threadId, threadId));
  }
}

/**
 * Singleton instance of PostgresSaver for use in LangGraph workflows.
 */
export const pgCheckpointer = new PostgresSaver();