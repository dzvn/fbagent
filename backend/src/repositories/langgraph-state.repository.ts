import { BaseRepository, AbstractBaseRepository } from './base.repository';

export type LangGraphState = {
  id: string;
  conversationId: string;
  currentState: 'INITIAL' | 'AWAITING_INFO' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  context: Record<string, any>;
  variables: Record<string, any>;
  history: StateTransition[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
};

export interface StateTransition {
  from: string;
  to: string;
  timestamp: Date;
  reason?: string;
  data?: Record<string, any>;
}

export type LangGraphStateInsert = Omit<LangGraphState, 'id' | 'createdAt' | 'updatedAt' | 'history'> & {
  history?: StateTransition[];
};

export interface LangGraphStateRepository extends BaseRepository<LangGraphState, LangGraphStateInsert> {
  findByConversationId(conversationId: string): Promise<LangGraphState | null>;
  transition(id: string, newState: string, data?: Record<string, any>): Promise<LangGraphState>;
  findExpired(): Promise<LangGraphState[]>;
  cleanupExpired(): Promise<number>;
  addContext(id: string, context: Record<string, any>): Promise<LangGraphState>;
  setVariable(id: string, key: string, value: any): Promise<LangGraphState>;
}

export class LangGraphStateRepositoryImpl extends AbstractBaseRepository<LangGraphState, LangGraphStateInsert> implements LangGraphStateRepository {
  private storage: Map<string, LangGraphState> = new Map();
  private idCounter = 0;

  constructor(db: any) {
    super(db);
  }

  async findAll(): Promise<LangGraphState[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: string): Promise<LangGraphState | null> {
    return this.storage.get(id) || null;
  }

  async create(data: LangGraphStateInsert): Promise<LangGraphState> {
    const id = `state_${++this.idCounter}`;
    const state: LangGraphState = {
      ...data,
      id,
      history: data.history || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.storage.set(id, state);
    return state;
  }

  async update(id: string, data: Partial<LangGraphStateInsert>): Promise<LangGraphState | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated: LangGraphState = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date(),
    };
    this.storage.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async findByConversationId(conversationId: string): Promise<LangGraphState | null> {
    return Array.from(this.storage.values()).find((state) => state.conversationId === conversationId) || null;
  }

  async transition(id: string, newState: string, data?: Record<string, any>): Promise<LangGraphState> {
    const state = await this.findById(id);
    if (!state) {
      throw new Error(`State ${id} not found`);
    }

    const transition: StateTransition = {
      from: state.currentState,
      to: newState,
      timestamp: new Date(),
      data,
    };

    const updated: LangGraphState = {
      ...state,
      currentState: newState as LangGraphState['currentState'],
      history: [...state.history, transition],
      updatedAt: new Date(),
    };

    this.storage.set(id, updated);
    return updated;
  }

  async findExpired(): Promise<LangGraphState[]> {
    const now = new Date();
    return Array.from(this.storage.values()).filter((state) => state.expiresAt && state.expiresAt < now);
  }

  async cleanupExpired(): Promise<number> {
    const expired = await this.findExpired();
    let count = 0;
    for (const state of expired) {
      const deleted = await this.delete(state.id);
      if (deleted) count++;
    }
    return count;
  }

  async addContext(id: string, context: Record<string, any>): Promise<LangGraphState> {
    const state = await this.findById(id);
    if (!state) {
      throw new Error(`State ${id} not found`);
    }

    const updated: LangGraphState = {
      ...state,
      context: { ...state.context, ...context },
      updatedAt: new Date(),
    };

    this.storage.set(id, updated);
    return updated;
  }

  async setVariable(id: string, key: string, value: any): Promise<LangGraphState> {
    const state = await this.findById(id);
    if (!state) {
      throw new Error(`State ${id} not found`);
    }

    const updated: LangGraphState = {
      ...state,
      variables: { ...state.variables, [key]: value },
      updatedAt: new Date(),
    };

    this.storage.set(id, updated);
    return updated;
  }
}

export const langgraphStateRepo = new LangGraphStateRepositoryImpl(null);
