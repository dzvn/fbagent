# LangChain + LangGraph Integration Guide

## Overview

FB Agent v0.2.0 now includes LangChain + LangGraph for intelligent conversation handling with:

- **ReAct Agent** - Reasoning + Action pattern for complex queries
- **LangGraph Workflow** - State machine for conversation flow
- **Multi-Model Support** - Switch between OpenAI, Anthropic, Ollama
- **Custom Tools** - Order detection, KB search, conversation logging

## Architecture

```
User Message → LangGraph Workflow → Intent Classification
                                         ↓
                    ┌────────────────────┼────────────────────┐
                    ↓                    ↓                    ↓
              Order Intent         General Query        Human Handoff
                    ↓                    ↓                    ↓
            Extract Info          Search KB              Notify Admin
                    ↓                    ↓                    ↓
              Response ←─────────────────┴────────────────────┘
```

## Quick Start

### 1. Set LLM Configuration

```bash
# Copy example env
cp .env.example .env

# Edit with your API keys
nano .env
```

### 2. Configure Model

**Option A: OpenAI**
```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

**Option B: Anthropic Claude**
```bash
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...
```

**Option C: Ollama (Self-hosted)**
```bash
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Restart Services

```bash
docker compose down
docker compose up -d
```

## API Endpoints

### Process Message with LangGraph

```bash
POST http://localhost:9001/api/langgraph/process
Content-Type: application/json

{
  "message": "Tôi muốn mua sản phẩm A",
  "senderId": "facebook_user_123",
  "pageId": "page_456"
}

# Response:
{
  "response": "Dạ mình thấy bạn muốn đặt hàng...",
  "intent": "order",
  "orderDetected": true,
  "orderInfo": { "phone": "0912345678" },
  "needsHumanHandoff": false,
  "source": "langgraph"
}
```

### Chat with LLM Agent (ReAct)

```bash
POST http://localhost:9001/api/agent/chat
Content-Type: application/json

{
  "message": "Sản phẩm này có bảo hành không?",
  "conversationHistory": ["previous messages..."]
}

# Response:
{
  "response": "Dạ sản phẩm có bảo hành 12 tháng...",
  "source": "llm-agent",
  "model": "gpt-4o-mini"
}
```

### Get Available Models

```bash
GET http://localhost:9001/api/models

# Response:
{
  "models": [
    { "id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai" },
    { "id": "claude-3-5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "anthropic" },
    ...
  ],
  "currentConfig": { "provider": "openai", "model": "gpt-4o-mini" }
}
```

### Update Model Configuration

```bash
POST http://localhost:9001/api/models/config
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "apiKey": "sk-ant-...",
  "temperature": 0.7
}
```

## Available Tools

### 1. detect_order
Detects order intent and extracts information from customer messages.

```typescript
{
  name: "detect_order",
  description: "Detect if customer wants to place an order",
  schema: {
    message: string,
    conversationHistory: string[]
  }
}
```

### 2. search_knowledge_base
Searches the knowledge base for relevant information.

```typescript
{
  name: "search_knowledge_base",
  description: "Search KB for answers",
  schema: { query: string }
}
```

### 3. save_conversation
Saves conversation to database for analytics.

## LangGraph Workflow States

```typescript
{
  messages: string[],           // Conversation history
  senderId: string,             // Facebook user ID
  pageId: string,               // Facebook page ID
  currentMessage: string,       // Current user message
  intent: string | null,        // Detected intent
  orderDetected: boolean,       // Order flag
  orderInfo: any | null,        // Extracted order data
  response: string | null,      // Generated response
  needsHumanHandoff: boolean    // Escalation flag
}
```

## Intent Types

| Intent | Keywords | Action |
|--------|----------|--------|
| order | mua, đặt, order, cần | Extract order info |
| pricing | giá, bao nhiêu | Search KB |
| location | địa chỉ, ở đâu | Search KB |
| hours | giờ mở cửa, mấy giờ | Search KB |
| support | đổi trả, bảo hành | Search KB |
| human_handoff | gặp người, admin | Escalate |
| general | other | General response |

## Custom Tools

Create new tools in `backend/src/tools/`:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const myCustomTool = tool(
  async (input: { param: string }) => {
    // Tool logic here
    return { result: "data" };
  },
  {
    name: "my_tool",
    description: "What this tool does",
    schema: z.object({
      param: z.string()
    })
  }
);
```

Then add to agent in `backend/src/agent/agent.ts`:

```typescript
const tools = [orderDetectionTool, knowledgeSearchTool, myCustomTool];
```

## Troubleshooting

### LLM API Errors
- Check API key is valid
- Verify network connectivity
- Check rate limits

### Ollama Connection
- Ensure Ollama is running: `ollama serve`
- Pull model: `ollama pull llama3.1`
- Docker networking: use `host.docker.internal`

### LangGraph State Issues
- Check state schema matches
- Verify node functions return correct types

## Performance Tips

1. **Use GPT-4o Mini** for cost-effective production
2. **Cache KB searches** to reduce API calls
3. **Set temperature < 0.7** for consistent responses
4. **Use rule-based fallback** when LLM is unavailable
