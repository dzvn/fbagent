export interface TenantConfig {
  autoReplyEnabled: boolean;
  greetingMessage?: string;
  fallbackMessage?: string;
  businessHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  [key: string]: any;
}

export interface Tenant {
  id: string;
  pageId: string;
  name: string;
  config: TenantConfig;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantInsert = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;

import { BaseRepository, AbstractBaseRepository } from './base.repository';

function getTenantRepository(db?: any): TenantRepository {
  return tenantRepo;
}

export interface TenantRepository extends BaseRepository<Tenant, TenantInsert> {
  getByPageId(pageId: string): Promise<Tenant | null>;
  updateConfig(pageId: string, config: Partial<TenantConfig>): Promise<Tenant | null>;
  upsertByPageId(pageId: string, name: string): Promise<{ tenant: Tenant; created: boolean }>;
}

export class TenantRepositoryImpl extends AbstractBaseRepository<Tenant, TenantInsert> implements TenantRepository {
  private storage: Map<string, Tenant> = new Map();
  private idCounter = 0;

  constructor(db: any) {
    super(db);
  }

  async findAll(): Promise<Tenant[]> {
    return Array.from(this.storage.values());
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.storage.get(id) || null;
  }

  async create(data: TenantInsert): Promise<Tenant> {
    const id = `tenant_${++this.idCounter}`;
    const tenant: Tenant = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.storage.set(id, tenant);
    return tenant;
  }

  async update(id: string, data: Partial<TenantInsert>): Promise<Tenant | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;

    const updated: Tenant = {
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

  async getByPageId(pageId: string): Promise<Tenant | null> {
    for (const tenant of this.storage.values()) {
      if (tenant.pageId === pageId) return tenant;
    }
    return null;
  }

  async updateConfig(pageId: string, config: Partial<TenantConfig>): Promise<Tenant | null> {
    const tenant = await this.getByPageId(pageId);
    if (!tenant) return null;

    tenant.config = { ...tenant.config, ...config };
    tenant.updatedAt = new Date();
    this.storage.set(tenant.id, tenant);

    return tenant;
  }

  async upsertByPageId(pageId: string, name: string): Promise<{ tenant: Tenant; created: boolean }> {
    let tenant = await this.getByPageId(pageId);
    let created = false;

    if (!tenant) {
      tenant = await this.create({
        pageId,
        name,
        config: {
          autoReplyEnabled: true,
          greetingMessage: 'Hello! How can I help you?',
          fallbackMessage: "I'm sorry, I didn't understand that.",
        },
      });
      created = true;
    }

    return { tenant, created };
  }
}

export const tenantRepo = new TenantRepositoryImpl(null);
