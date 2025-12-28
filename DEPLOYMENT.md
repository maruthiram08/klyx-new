# Deployment Guide - Klyx Platform

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] PostgreSQL database provisioned (Render, Supabase, or similar)
- [ ] Database schema applied (`backend/database/schema.sql`)
- [ ] Initial stock data populated (2,221 NSE stocks)

### 2. Environment Variables

#### Backend Services (Render)
Create these environment variables in Render dashboard for all backend services:

```bash
# Database
POSTGRES_URL=postgresql://user:pass@host:5432/dbname

# Redis Cache
REDIS_URL=rediss://default:password@host:port

# Security
JWT_SECRET_KEY=your-secret-key-here

# AI Service
OPENAI_API_KEY=sk-...

# Optional: MoneyControl scraping
USER_AGENT=Mozilla/5.0...
```

#### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://klyx-backend.onrender.com
NEXT_PUBLIC_AI_URL=https://klyx-ai.onrender.com
```

### 3. Service Deployment

#### Render (Backend)
Services defined in `render.yaml`:

1. **klyx-backend** (Flask API)
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app`
   - Health Check: `/api/health`

2. **klyx-ai** (FastAPI AI Service)
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn ai_service:app --host 0.0.0.0 --port 8000`

3. **klyx-worker** (Background Jobs)
   - Build: `pip install -r requirements.txt`
   - Start: `python worker_app.py`
   - Endpoints: `/worker/enrich`, `/worker/populate`

#### Vercel (Frontend)
- Auto-deploys from `main` branch
- Build Command: `npm run build`
- Output Directory: `.next`

### 4. Cron Jobs Configuration

#### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "0 18 * * *"
    }
  ]
}
```

This triggers the worker's `/worker/enrich` endpoint daily at 6 PM IST.

### 5. Database Migrations

Run these scripts in order after initial deployment:

```bash
# 1. Apply base schema
psql $POSTGRES_URL < backend/database/schema.sql

# 2. Populate initial stocks
python backend/database/stock_populator.py

# 3. Verify columns exist
python backend/check_coverage.py
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Backend API
curl https://klyx-backend.onrender.com/api/health

# AI Service
curl https://klyx-ai.onrender.com/health

# Worker
curl https://klyx-worker.onrender.com/health
```

### 2. Test Key Flows
- [ ] User can log in
- [ ] Dashboard loads with market data
- [ ] Stock search returns results
- [ ] Stock details page shows all metrics (Durability, Valuation, Momentum, Forecaster)
- [ ] Screener presets work (Magic Formula, CANSLIM, etc.)
- [ ] Error pages display correctly (404, 500)

### 3. Monitor Logs
```bash
# Render: Check service logs for errors
# Vercel: Check function logs in dashboard
```

### 4. Data Population Status
```bash
# SSH into worker or run locally
python backend/check_coverage.py

# Expected output:
# Total Stocks: 2221
# Durability Score: ~2000+
# Momentum Score: ~2000+
# Target Price: ~1500+ (varies by analyst coverage)
```

## Rollback Plan

If deployment fails:

1. **Vercel**: Revert to previous deployment via dashboard
2. **Render**: Rollback via "Manual Deploy" → select previous commit
3. **Database**: Restore from backup (if schema changes were made)

## Performance Monitoring

### Key Metrics to Track
- API response time (target: <500ms)
- Database query time (target: <100ms)
- Cache hit rate (target: >80%)
- Error rate (target: <1%)

### Tools
- Render: Built-in metrics dashboard
- Vercel: Analytics & Speed Insights
- Database: Query performance logs

## Troubleshooting

### Common Issues

**Issue**: Port conflict on local development
**Solution**: Use `./backend/start.sh` instead of `python app.py`

**Issue**: Missing environment variables
**Solution**: Check `.env` files are not committed to git, verify Render/Vercel env vars

**Issue**: Database connection timeout
**Solution**: Check `POSTGRES_URL` format, verify database is accessible from Render IPs

**Issue**: Cron job not triggering
**Solution**: Verify `vercel.json` is in root, check Vercel cron logs

## Security Checklist

- [ ] No API keys in code (use environment variables)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (Flask-Limiter)
- [ ] SQL injection protection (parameterized queries)
- [ ] HTTPS enforced on all endpoints
- [ ] JWT secret is strong and unique

## Support

For deployment issues:
- Check Render/Vercel status pages
- Review service logs
- Contact: support@klyx.app
