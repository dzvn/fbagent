import { Elysia, t } from "elysia";

const knowledgeBase = new Map<string, any>();
let kbIdCounter = 0;

function searchKB(query: string, limit = 5) {
  const queryLower = query.toLowerCase();
  const results: any[] = [];
  
  for (const kb of knowledgeBase.values()) {
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

export const knowledgeRoutes = new Elysia()
  .get("/api/knowledge", () => {
    return Array.from(knowledgeBase.values());
  })
  .get("/api/knowledge/search", ({ query }: { query: Record<string, string> }) => {
    const q = query.q || "";
    return searchKB(q);
  })
  .post("/api/knowledge", ({ body }: { body: any }) => {
    const id = `kb_${++kbIdCounter}`;
    const entry = {
      id,
      title: body.title,
      content: body.content,
      source: body.source || "manual",
      tags: body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    knowledgeBase.set(id, entry);
    return { success: true, data: entry };
  }, {
    body: t.Object({
      title: t.String(),
      content: t.String(),
      source: t.Optional(t.String()),
      tags: t.Optional(t.Array(t.String()))
    })
  })
  .post("/api/knowledge/import", async ({ body }: { body: any }) => {
    const items = Array.isArray(body) ? body : [body];
    const imported = [];
    
    for (const item of items) {
      const id = `kb_${++kbIdCounter}`;
      const entry = {
        id,
        title: item.title || item.question || "Untitled",
        content: item.content || item.answer || item.body || "",
        source: item.source || "import",
        tags: item.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      knowledgeBase.set(id, entry);
      imported.push(entry);
    }
    
    return { success: true, count: imported.length, data: imported };
  }, {
    body: t.Any()
  })
  .delete("/api/knowledge/:id", ({ params }: { params: Record<string, string> }) => {
    knowledgeBase.delete(params.id);
    return { success: true };
  });
