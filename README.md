# FB Agent

Auto-reply agent for Facebook Page messages with knowledge base.

## Quick Start

```bash
docker compose up -d
```

## Services

- **Backend API:** http://localhost:9000
- **Frontend Admin:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## Development

```bash
# Backend
cd backend && bun run dev

# Frontend
cd frontend && bun run dev
```

## Docs

See [SPEC.md](./SPEC.md) for detailed specification.
