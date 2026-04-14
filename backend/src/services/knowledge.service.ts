import { KnowledgeBase } from '../db/schema';
import { KnowledgeRepository, knowledgeRepo } from '../repositories/knowledge.repository';

export class KnowledgeService {
  constructor(private repo: KnowledgeRepository = knowledgeRepo) {}

  async getAll(): Promise<KnowledgeBase[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<KnowledgeBase | null> {
    return this.repo.findById(id);
  }

  async create(data: Omit<KnowledgeBase, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBase> {
    return this.repo.create(data);
  }

  async update(id: string, data: Partial<KnowledgeBase>): Promise<KnowledgeBase | null> {
    return this.repo.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async search(query: string, limit = 5): Promise<Array<KnowledgeBase & { score: number }>> {
    return this.repo.search(query, limit);
  }

  async importBatch(items: Array<Partial<KnowledgeBase>>): Promise<KnowledgeBase[]> {
    return this.repo.importBatch(items);
  }
}

export const defaultKnowledgeService = new KnowledgeService();
