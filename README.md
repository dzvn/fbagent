# FB Agent - Facebook Auto-Reply Agent

🤖 Auto-reply agent for Facebook Page messages with knowledge base support.

## Features

- ✅ **Facebook Messenger Integration** - Webhook receiver for FB Page messages
- ✅ **Knowledge Base** - Import from CSV/JSON or manual entry
- ✅ **Auto-Reply Engine** - Rule-based responses with confidence scoring
- ✅ **Admin Dashboard** - React + Vite frontend for management
- ✅ **Docker Compose** - All services containerized

## Quick Start

```bash
# Clone and start all services
git clone https://github.com/dzvn/fbagent.git
cd fbagent
docker compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Admin dashboard |
| Backend API | 9001 | REST API |
| PostgreSQL | 5433 | Database |
| Redis | 6380 | Cache/Queue |
| Worker | - | Background jobs |

## API Endpoints

### Health Check
```bash
GET http://localhost:9001/health
```

### Webhook
```bash
GET  http://localhost:9001/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
POST http://localhost:9001/webhook
```

### Knowledge Base
```bash
GET    http://localhost:9001/api/knowledge
GET    http://localhost:9001/api/knowledge/search?q=query
POST   http://localhost:9001/api/knowledge
POST   http://localhost:9001/api/knowledge/import
DELETE http://localhost:9001/api/knowledge/:id
```

### Auto-Reply
```bash
POST http://localhost:9001/api/auto-reply
GET  http://localhost:9001/api/auto-reply/rules
POST http://localhost:9001/api/auto-reply/rules
```

### Admin
```bash
GET  http://localhost:9001/api/admin/stats
GET  http://localhost:9001/api/admin/config
POST http://localhost:9001/api/admin/config
GET  http://localhost:9001/api/admin/logs
```

## Facebook Setup

1. Create Facebook App at https://developers.facebook.com
2. Add Messenger product
3. Configure webhook URL: `https://your-domain.com/webhook`
4. Set verify token: `fbagent_verify_2026` (or custom via env)
5. Subscribe to messages event

## Environment Variables

```bash
# .env
FB_VERIFY_TOKEN=fbagent_verify_2026
FB_PAGE_ACCESS_TOKEN=your_page_token
WEBHOOK_URL=https://your-domain.com/webhook
```

## Test Auto-Reply

```bash
# Test via curl
curl -X POST http://localhost:9001/api/auto-reply \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"chào bạn\"}"

# Response:
# {"response":"Chào bạn! Mình là trợ lý tự động...","source":"rule","confidence":0.9}
```

## Default Reply Rules

1. **Greeting** - "chào", "hi", "hello" → Welcome message
2. **Pricing** - "giá", "bao nhiêu" → Pricing info
3. **Location** - "địa chỉ", "ở đâu" → Address
4. **Hours** - "giờ mở cửa", "mấy giờ" → Business hours

## Development

```bash
# Backend (requires Bun)
cd backend && bun run dev

# Frontend
cd frontend && bun run dev
```

## Tech Stack

- **Backend:** Node.js + TypeScript + Elysia (Bun runtime)
- **Frontend:** React + Vite
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Container:** Docker Compose

## License

MIT
