// Knowledge Base Repository
import { KnowledgeBase } from '../db/schema';
import { BaseRepository, AbstractBaseRepository } from './base.repository';

export type KnowledgeInsert = Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>;

export interface KnowledgeRepository extends BaseRepository<KnowledgeBase, KnowledgeInsert> {
  search(query: string, limit?: number): Promise<Array<KnowledgeBase & { score: number }>>;
  findByTags(tags: string[]): Promise<KnowledgeBase[]>;
  importBatch(items: Array<Partial<KnowledgeBase>>): Promise<KnowledgeBase[]>;
}

export class KnowledgeRepositoryImpl extends AbstractBaseRepository<KnowledgeBase, KnowledgeInsert> implements KnowledgeRepository {
  private storage: Map<string, KnowledgeBase> = new Map();
  private idCounter = 0;

  constructor(db: any) {
    super(db);
  }

  async findAll(): Promise<KnowledgeBase[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: string): Promise<KnowledgeBase | null> {
    return this.storage.get(id) || null;
  }

  async create(data: KnowledgeInsert): Promise<KnowledgeBase> {
    const id = `kb_${++this.idCounter}`;
    const entry: KnowledgeBase = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.storage.set(id, entry);
    return entry;
  }

  async update(id: string, data: Partial<KnowledgeInsert>): Promise<KnowledgeBase | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated: KnowledgeBase = {
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

  async search(query: string, limit = 5): Promise<Array<KnowledgeBase & { score: number }>> {
    const queryLower = query.toLowerCase();
    const results: Array<KnowledgeBase & { score: number }> = [];

    for (const kb of this.storage.values()) {
      const titleMatch = kb.title.toLowerCase().includes(queryLower);
      const contentMatch = kb.content.toLowerCase().includes(queryLower);
      const tagMatch = kb.tags.some((t: string) => t.toLowerCase().includes(queryLower));

      if (titleMatch || contentMatch || tagMatch) {
        let score = 0;
        if (titleMatch) score += 3;
        if (contentMatch) score += 1;
        if (tagMatch) score += 2;
        results.push({ ...kb, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async findByTags(tags: string[]): Promise<KnowledgeBase[]> {
    return Array.from(this.storage.values()).filter((kb) =>
      kb.tags.some((tag: string) => tags.includes(tag))
    );
  }

  async importBatch(items: Array<Partial<KnowledgeBase>>): Promise<KnowledgeBase[]> {
    const imported: KnowledgeBase[] = [];

    for (const item of items) {
      const id = `kb_${++this.idCounter}`;
      const entry: KnowledgeBase = {
        id,
        title: item.title || 'Untitled',
        content: item.content || '',
        source: item.source || 'import',
        tags: item.tags || [],
        embedding: item.embedding,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.storage.set(id, entry);
      imported.push(entry);
    }

    return imported;
  }
}

export const knowledgeRepo = new KnowledgeRepositoryImpl(null);

function getKnowledgeRepository(db?: any): KnowledgeRepository {
  return knowledgeRepo;
}
