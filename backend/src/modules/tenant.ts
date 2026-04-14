import { Elysia, t } from "elysia";

const tenants: any[] = [];

export const tenantRoutes = new Elysia()
  .get("/api/tenants", () => ({ tenants }))
  .post("/api/tenants", ({ body }: { body: any }) => {
    const tenant = { id: `tenant_${Date.now()}`, ...body, created_at: new Date() };
    tenants.push(tenant);
    return { success: true, data: tenant };
  }, {
    body: t.Object({ page_id: t.String(), name: t.String() })
  })
  .get("/api/tenants/:id", ({ params }: { params: any }) => {
    const tenant = tenants.find(t => t.id === params.id);
    return tenant || { error: "Not found" };
  })
  .put("/api/tenants/:id", ({ params, body }: { params: any, body: any }) => {
    const idx = tenants.findIndex(t => t.id === params.id);
    if (idx === -1) return { error: "Not found" };
    tenants[idx] = { ...tenants[idx], ...body };
    return { success: true, data: tenants[idx] };
  })
  .delete("/api/tenants/:id", ({ params }: { params: any }) => {
    const idx = tenants.findIndex(t => t.id === params.id);
    if (idx === -1) return { error: "Not found" };
    tenants.splice(idx, 1);
    return { success: true };
  })
  .post("/api/tenants/resolve", ({ body }: { body: any }) => {
    let tenant = tenants.find(t => t.page_id === body.page_id);
    if (!tenant) {
      tenant = { id: `tenant_${Date.now()}`, ...body, created_at: new Date() };
      tenants.push(tenant);
    }
    return { success: true, data: tenant, created: !tenant.id.startsWith("tenant_") };
  }, {
    body: t.Object({ page_id: t.String() })
  })
  .get("/api/tenants/page/:pageId", ({ params }: { params: any }) => {
    const tenant = tenants.find(t => t.page_id === params.pageId);
    return tenant || { error: "Not found" };
  });
