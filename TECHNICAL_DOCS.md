# Technical Documentation

## System Overview

Klyx is a full-stack stock analysis platform for the Indian market (NSE/BSE).

---

## Backend Architecture

### Services

| Service | Framework | Purpose |
|---------|-----------|---------|
| klyx-backend | Flask | Main REST API |
| klyx-ai | FastAPI | AI/LLM endpoints |
| klyx-worker | Flask | Background job triggers |
| klyx-celery-worker | Celery | Async task processing |

### Database

**PostgreSQL** (production) with:
- 17 performance indexes
- Connection pooling (ThreadedConnectionPool)
- Batch query endpoints (N+1 fix)

### Caching Strategy

| Layer | Technology | TTL |
|-------|------------|-----|
| Server-side | Flask-Caching + Redis | 5 min |
| HTTP | Cache-Control headers | 5 min |
| Client | TanStack Query | 5 min |

### Security

- **Rate Limiting**: 1000/hour, 100/minute per IP
- **Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **Input Validation**: Search sanitization, parameter bounds
- **Auth**: JWT with httpOnly cookies

---

## Frontend Architecture

### Tech Stack

- Next.js 16 (App Router)
- TanStack Query v5
- @tanstack/react-virtual
- Tailwind CSS

### Performance Features

| Feature | Implementation | Impact |
|---------|----------------|--------|
| Lazy Loading | next/dynamic for ChatAssistant | -45KB initial bundle |
| Data Caching | TanStack Query with 5min staleTime | Reduced API calls |
| Prefetching | prefetchNextPage on hover | Instant pagination |
| Virtual Scrolling | VirtualStockTable | 60fps with 1000+ rows |
| Non-blocking Auth | loading: false initially | Faster FCP |

### Key Hooks

```typescript
// hooks/useStocks.ts
useStocks({ limit, offset, sector, search })
// Returns: { stocks, total, isLoading, prefetchNextPage }

// hooks/useTaskStatus.ts
useTaskStatus(taskId)
// Returns: { status, progress, result }
```

---

## API Endpoints

### Database API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/database/stocks | List stocks with pagination |
| POST | /api/database/stocks/batch | Fetch multiple stocks by name |
| GET | /api/database/stats | Database statistics |

### Auth API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Get current user |

### AI API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/chat | Chat with AI assistant |
| GET | /api/ai/health | Health check |

---

## Background Jobs (Celery)

### Tasks

| Task | Trigger | Description |
|------|---------|-------------|
| process_portfolio_task | /api/process | Process uploaded portfolio |
| enrich_stock_database_task | Cron | Fetch external data |
| refresh_stock_database_task | Cron | Update stock prices |

### Configuration

```python
# celery_app.py
broker = REDIS_URL
result_backend = REDIS_URL
task_serializer = 'json'
result_expires = 3600
```

---

## Deployment

### Render.yaml Services

```yaml
services:
  - type: web
    name: klyx-backend
    startCommand: gunicorn app:app
    
  - type: web
    name: klyx-ai
    startCommand: uvicorn ai_api:app
    
  - type: worker
    name: klyx-celery-worker
    startCommand: celery -A celery_app worker
```

### Vercel Cron

```json
{
  "crons": [
    { "path": "/api/cron/refresh", "schedule": "0 13 * * 1-5" }
  ]
}
```

---

## Monitoring

- **Render**: Service logs in dashboard
- **Vercel**: Function logs
- **Upstash**: Redis metrics
- **Structured Logging**: JSON format in production

---

## Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/test_api.py -v
```

Categories:
- Security headers
- Rate limiting
- Input validation
- API endpoints
- Caching behavior

### Frontend Tests

```bash
cd frontend
npm test
```

Categories:
- Hook behavior
- Component structure
- File existence checks
