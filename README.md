# FB Agent - Facebook Auto-Reply Agent with LangChain + LangGraph

🤖 Intelligent auto-reply agent for Facebook Pages powered by LangChain + LangGraph with multi-LLM support.

## Features

- ✅ **LangChain ReAct Agent** - LLM-powered reasoning with tools
- ✅ **LangGraph Workflow** - State machine for conversation flow
- ✅ **Multi-Model Support** - OpenAI, Anthropic, Ollama, custom endpoints
- ✅ **Facebook Messenger Integration** - Webhook receiver
- ✅ **Knowledge Base** - Import from CSV/JSON or manual entry
- ✅ **Order Detection** - Auto-detect purchase intent
- ✅ **Admin Dashboard** - React + Vite frontend
- ✅ **Docker Compose** - All services containerized

## Quick Start

```bash
git clone https://github.com/dzvn/fbagent.git
cd fbagent
cp .env.example .env
# Edit .env with your API keys
docker compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Admin dashboard |
| Backend API | 9001 | REST API + LangGraph |
| PostgreSQL | 5433 | Database |
| Redis | 6380 | Cache/Queue |
| Worker | - | Background jobs |

## LLM Configuration

### OpenAI
```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

### Anthropic Claude
```bash
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...
```

### Ollama (Self-hosted)
```bash
LLM_PROVIDER=ollama
LLM_MODEL=llama3.1
```

## API Endpoints

### LangGraph Process
```bash
POST http://localhost:9001/api/langgraph/process
{
  "message": "Tôi muốn mua sản phẩm",
  "senderId": "user123",
  "pageId": "page456"
}
```

### LLM Agent Chat
```bash
POST http://localhost:9001/api/agent/chat
{
  "message": "Sản phẩm có bảo hành không?",
  "conversationHistory": []
}
```

### Model Configuration
```bash
GET  http://localhost:9001/api/models
POST http://localhost:9001/api/models/config
```

## Documentation

- [SPEC.md](./SPEC.md) - Architecture specification
- [LANGCHAIN_INTEGRATION.md](./LANGCHAIN_INTEGRATION.md) - LangChain setup guide
- [FACEBOOK_SETUP.md](./FACEBOOK_SETUP.md) - Facebook integration
- [.env.example](./.env.example) - Environment template

## Tech Stack

- **Backend:** Node.js + TypeScript + Elysia (Bun)
- **AI:** LangChain + LangGraph + ReAct Agent
- **LLMs:** OpenAI, Anthropic, Ollama
- **Frontend:** React + Vite
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Container:** Docker Compose

## License

MIT
