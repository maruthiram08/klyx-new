# Klyx - Stock Analysis & Portfolio Management

A comprehensive stock analysis and portfolio management tool for the Indian market (NSE).

## Features

- **Portfolio Analysis** - Track and analyze your stock portfolio with real-time data
- **Advanced Stock Screener** - Filter stocks with custom criteria or preset strategies
  - Magic Formula (ROCE + Earnings Yield)
  - CANSLIM Growth (EPS Growth + Relative Strength)
  - Trendlyne DVM (Durability, Valuation, Momentum scores)
  - Forecaster (Analyst Ratings & Price Targets)
- **Debt Optimizer** - Analyze and optimize debt reduction strategies
- **AI Assistant (Ask Klyx)** - AI-powered stock insights and Q&A
- **Market Data** - Real-time data from NSE, MoneyControl, Yahoo Finance

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS, Lucide Icons
- **State**: TanStack Query (React Query) for caching & prefetching
- **Performance**: Virtual scrolling, lazy loading, non-blocking auth

### Backend
- **API**: Flask + Flask-Limiter (rate limiting)
- **AI Service**: FastAPI + LangChain
- **Database**: PostgreSQL (production) / SQLite (dev)
- **Caching**: Redis (Upstash) + Flask-Caching
- **Background Jobs**: Celery with Redis broker
- **Security**: Rate limiting, input validation, security headers

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         (Next.js on Vercel)                     │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌───────────────┐
│  klyx-backend │    │   klyx-ai     │
│    (Flask)    │    │  (FastAPI)    │
└───────┬───────┘    └───────┬───────┘
        │                     │
        └──────────┬──────────┘
                   ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         │   + Redis       │
         └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis (optional, for caching)

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt

# Option 1: Use startup script (auto-kills port conflicts)
./start.sh

# Option 2: Manual start
python app.py
# API runs at http://localhost:5001
```

## Environment Variables

### Backend (.env)
```
POSTGRES_URL=postgresql://...
JWT_SECRET_KEY=your-secret
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=sk-...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://klyx-backend.onrender.com
NEXT_PUBLIC_AI_URL=https://klyx-ai.onrender.com
```

## Deployment

### Render (Backend)
Services defined in `render.yaml`:
- `klyx-backend` - Main Flask API
- `klyx-ai` - FastAPI AI service
- `klyx-worker` - Background jobs

### Vercel (Frontend)
- Auto-deploys from `main` branch
- Cron jobs in `vercel.json`

## Performance Optimizations

### Backend
- ✅ Database indexes (17 indexes)
- ✅ Connection pooling
- ✅ Server-side caching (Redis/Flask-Caching)
- ✅ Rate limiting (Flask-Limiter)
- ✅ Background jobs (Celery)
- ✅ Security headers

### Frontend
- ✅ Lazy load ChatAssistant (-45KB bundle)
- ✅ TanStack Query (5min cache, prefetching)
- ✅ Virtual scrolling (@tanstack/react-virtual)
- ✅ Non-blocking auth flow
- ✅ next/image optimization

## Testing

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && npm test
```

## Project Structure

```
├── frontend/           # Next.js app
│   ├── app/           # Pages (App Router)
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks (useStocks, etc)
│   └── providers/     # QueryProvider, AuthProvider
├── backend/           # Flask API
│   ├── api/           # Route blueprints
│   ├── database/      # DB config, migrations
│   ├── services/      # Business logic
│   └── tasks/         # Celery tasks
└── render.yaml        # Render deployment config
```

## License

MIT
