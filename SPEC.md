# FB Agent - Specification

## Overview
Auto-reply agent for Facebook Page messages with knowledge base from website crawl or manual import.

## Tech Stack
- Backend: Node.js + TypeScript + Elysia (Bun runtime)
- Frontend: React + Vite + Revolut Design System
- Database: PostgreSQL 15
- Cache/Queue: Redis
- Container: Docker Compose

## Core Features

### 1. Facebook Messenger Integration
- Webhook receiver for FB Page messages
- Send/Receive API integration
- Multi-page support
- Message threading

### 2. Knowledge Base
- Crawl Module: Crawl website URLs, extract content
- Import Module: CSV/JSON upload from admin portal
- Vector Search: Semantic search for relevant answers
- Embedding: Generate embeddings for KB articles

### 3. Auto-Reply Engine
- Rule-based responses
- AI-powered responses (LLM integration)
- Confidence threshold
- Fallback to human handoff

### 4. Admin Portal
- Dashboard for metrics
- KB management (CRUD)
- Crawl job management
- Response logs and analytics
- Configuration settings

## MVP Scope (v0.1.0)
- Single FB Page connection
- Basic webhook receiver
- Manual KB import (CSV/JSON)
- Rule-based auto-reply
- Basic admin dashboard
- Docker Compose setup
