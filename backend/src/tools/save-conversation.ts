import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConversationService, defaultConversationService } from "../services/conversation.service";

export const createSaveConversationTool = (conversationService: ConversationService = defaultConversationService) => {
  return tool(
    async (input: { senderId: string; pageId: string; message: string; response: string }) => {
      try {
        const conversation = await conversationService.createOrGet(input.senderId, input.pageId);
        
        await conversationService.addMessage(conversation.id, 'user', input.message);
        
        await conversationService.addMessage(conversation.id, 'assistant', input.response);
        
        return { 
          success: true, 
          conversationId: conversation.id, 
          senderId: conversation.senderId,
          timestamp: new Date().toISOString() 
        };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to save conversation", 
          conversationId: null 
        };
      }
    },
    {
      name: "save_conversation",
      description: "Save conversation to database - creates or retrieves conversation and adds both user message and assistant response",
      schema: z.object({
        senderId: z.string().describe("Facebook sender ID"),
        pageId: z.string().describe("Facebook page ID"),
        message: z.string().describe("User message content"),
        response: z.string().describe("Assistant response content")
      })
    }
  );
};

export const saveConversationTool = createSaveConversationTool();