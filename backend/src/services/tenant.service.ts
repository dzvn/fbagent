import { Tenant, TenantConfig, TenantRepository, tenantRepo } from '../repositories/tenant.repository';

export class TenantService {
  constructor(private repo: TenantRepository = tenantRepo) {}

  async getAll(): Promise<Tenant[]> {
    return this.repo.findAll();
  }

  async getByPageId(pageId: string): Promise<Tenant | null> {
    return this.repo.getByPageId(pageId);
  }

  async create(pageId: string, name: string, config?: Partial<TenantConfig>): Promise<Tenant> {
    return this.repo.create({ pageId, name, config: config as TenantConfig });
  }

  async updateConfig(pageId: string, config: Partial<TenantConfig>): Promise<Tenant | null> {
    return this.repo.updateConfig(pageId, config);
  }
}

export const defaultTenantService = new TenantService();
