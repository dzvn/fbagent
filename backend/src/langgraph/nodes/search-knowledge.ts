import type { AgentState, KBResult } from "../state";
import { defaultKnowledgeService } from "../../services/knowledge.service";

/**
 * Search knowledge base node
 * Uses knowledgeService.search() directly (not HTTP fetch)
 */
export async function searchKnowledgeNode(state: AgentState): Promise<Partial<AgentState>> {
  const query = state.currentMessage;
  
  try {
    // Use knowledgeService.search() directly
    const results = await defaultKnowledgeService.search(query, 5);
    
    // Map to KBResult format
    const kbResults: KBResult[] = results.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      score: r.score,
    }));
    
    // If no results found, set needsHumanHandoff
    if (kbResults.length === 0) {
      return {
        kbResults: [],
        needsHumanHandoff: true,
        response: null, // Will be handled by generate_response
      };
    }
    
    // Return best matching result content
    const bestMatch = kbResults[0];
    return {
      kbResults,
      response: bestMatch.content,
      needsHumanHandoff: false,
    };
  } catch (error) {
    console.error("Knowledge search error:", error);
    return {
      kbResults: [],
      needsHumanHandoff: true,
      response: null,
    };
  }
}

/**
 * Routing function after search_knowledge
 */
export function routeAfterSearchKnowledge(state: AgentState): string {
  if (state.kbResults.length === 0 || state.needsHumanHandoff) {
    return "generate_response";
  }
  // If we have KB results with response, go to END
  return "generate_response";
}