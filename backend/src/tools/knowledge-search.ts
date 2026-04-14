import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { KnowledgeService, defaultKnowledgeService } from "../services/knowledge.service";

export const createKnowledgeSearchTool = (knowledgeService: KnowledgeService = defaultKnowledgeService) => {
  return tool(
    async (input: { query: string }) => {
      try {
        const results = await knowledgeService.search(input.query, 5);
        
        if (results.length === 0) {
          return { success: true, results: [], count: 0, message: "No matching knowledge found" };
        }
        
        const simplifiedResults = results.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          score: r.score
        }));
        
        return { 
          success: true, 
          results: simplifiedResults, 
          count: results.length 
        };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Search failed", 
          results: [] 
        };
      }
    },
    {
      name: "search_knowledge_base",
      description: "Search knowledge base for relevant information about products, services, FAQs, or policies",
      schema: z.object({
        query: z.string().describe("Search query to find relevant knowledge")
      })
    }
  );
};

export const knowledgeSearchTool = createKnowledgeSearchTool();