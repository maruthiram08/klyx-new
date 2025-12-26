# Stock Database System - Setup & Deployment Guide

## Overview

The Weekend Analysis Tool now uses a **database-driven architecture** for the stock screener:

- **Local Development**: SQLite (automatic, no setup needed)
- **Production (Vercel)**: Vercel Postgres (Neon)
- **Screener**: Works independently from portfolio uploads
- **Data**: All NSE/BSE stocks with auto-refresh

## Architecture

### Two Modes of Operation

**1. Screener Mode (Database-Driven)**
- Screens ALL NSE/BSE stocks from database
- No user uploads required
- Always available
- Updated periodically

**2. Portfolio Analysis Mode (File-Driven)**
- User uploads their Excel files
- Processes their specific stocks
- Same enrichment pipeline
- Saved to user's session

**Key Design**: Screener API automatically tries database first, falls back to uploaded portfolio data if needed.

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
cd backend
python3 database/stock_populator.py
```

**This will:**
1. Create SQLite database (`backend/database/stocks.db`)
2. Initialize schema (tables, indexes)
3. Populate Nifty 50 stocks
4. Enrich first 5 stocks with data

**Output:**
```
============================================================
Stock Database Populator
============================================================

1. Initializing database...
✅ Database initialized successfully

2. Fetching NSE stock list...
   Found 50 stocks

3. Populating stock list...
   ✓ Inserted: 50, Updated: 0

4. Enriching stock data (first 5 stocks)...
   ✓ Enriched: 5, Failed: 0

5. Database Statistics:
   total_stocks: 50
   high_quality_stocks: 5
   avg_quality: 100.0
   last_updated: 2025-12-25...

✅ Database population complete!
```

### 3. Start Backend

```bash
cd backend
python3 app.py
```

**Look for:**
```
✓ Database routes registered
 * Running on http://127.0.0.1:5001
```

### 4. Test Database Screener

```bash
# Get database stats
curl http://localhost:5001/api/database/stats

# List stocks
curl http://localhost:5001/api/database/stocks?limit=10

# Screen with database
curl http://localhost:5001/api/screener/preset/value
```

---

## Vercel Deployment

### 1. Create Vercel Postgres Database

**Via Vercel Dashboard:**
1. Go to your project → Storage
2. Click "Create Database"
3. Select "Postgres" (powered by Neon)
4. Choose region close to your users
5. Click "Create"

**Via Vercel CLI:**
```bash
vercel storage create postgres weekend-stocks
```

### 2. Environment Variables

Vercel automatically creates and sets:
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`

**Our app uses**: `POSTGRES_URL` (automatically detected)

### 3. Deploy Application

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 4. Initialize Production Database

**Method A: Via API (Recommended)**

```bash
# Get your production URL
PROD_URL="https://your-app.vercel.app"

# Initialize database
curl -X POST $PROD_URL/api/database/init

# Populate stocks
curl -X POST $PROD_URL/api/database/populate

# Enrich stocks (start with 10)
curl -X POST $PROD_URL/api/database/enrich \
  -H "Content-Type: application/json" \
  -d '{"max_stocks": 10, "batch_size": 5}'
```

**Method B: Via Vercel Console**

```bash
# Connect to your database
vercel env pull
psql $POSTGRES_URL

# Run schema
\i backend/database/schema.sql
```

### 5. Set Up Cron Job for Auto-Refresh

**Create**: `vercel.json` (already created)

**Add Cron Configuration:**
```json
{
  "crons": [{
    "path": "/api/database/refresh",
    "schedule": "0 2 * * *"
  }]
}
```

**This refreshes the database at 2 AM daily.**

---

## Database Management API

### Initialize Database
```bash
POST /api/database/init
```
Creates schema, tables, indexes.

### Populate Stock List
```bash
POST /api/database/populate
```
Adds all NSE/BSE stocks (names only, no data yet).

### Enrich Stock Data
```bash
POST /api/database/enrich
Content-Type: application/json

{
  "batch_size": 10,
  "max_stocks": 50
}
```
Fetches fundamental data for stocks.

### Database Statistics
```bash
GET /api/database/stats
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_stocks": 50,
    "high_quality_stocks": 45,
    "avg_quality": 92.5,
    "top_sectors": [...],
    "last_updated": "2025-12-25..."
  }
}
```

### List Stocks
```bash
GET /api/database/stocks?limit=50&offset=0&sector=IT
```

**Parameters:**
- `limit`: Stocks per page (default: 50)
- `offset`: Pagination offset (default: 0)
- `sector`: Filter by sector (optional)
- `min_quality`: Minimum quality score (default: 30)

### Get Stock Details
```bash
GET /api/database/stocks/RELIANCE
```

### Full Refresh
```bash
POST /api/database/refresh
Content-Type: application/json

{
  "full": true
}
```

**Full Refresh:**
- Updates stock list
- Enriches all stocks
- Can take 10-30 minutes

**Incremental Refresh** (`"full": false`):
- Updates only stale data (>7 days old)
- Faster (1-5 minutes)

### Get Sectors
```bash
GET /api/database/sectors
```

Returns all sectors with stock counts.

---

## Database Schema

### Main Tables

**`stocks`** - Primary stock data
- Identifiers: `id`, `nse_code`, `bse_code`, `isin`
- Classification: `sector_name`, `industry_name`
- Price: `current_price`, `market_cap`
- Ratios: `pe_ttm`, `roe_annual_pct`, `debt_to_equity`, etc.
- Quality: `data_quality_score`, `data_sources`
- 50+ fields total

**`stock_metadata`** - Extended data
- Balance sheet details
- 52-week ranges
- Company description

**`data_refresh_log`** - Audit trail
- Tracks all refresh operations
- Success/failure rates
- Duration metrics

**`user_screeners`** - Saved screens
- Custom user filters (future feature)
- Shareable presets

### Indexes
- `sector_name` - Fast sector filtering
- `market_cap` - Quick sorting
- `pe_ttm`, `roe_annual_pct` - Screening optimization
- `last_updated` - Stale data detection

---

## Data Refresh Strategy

### Automatic Refresh (Production)

**Daily Cron** (2 AM):
```
1. Populate new stocks
2. Enrich stocks with quality < 80
3. Enrich stocks older than 7 days
4. Log results
```

### Manual Refresh (Development)

```bash
# Populate new stocks only
curl -X POST http://localhost:5001/api/database/populate

# Enrich specific number
curl -X POST http://localhost:5001/api/database/enrich \
  -H "Content-Type: application/json" \
  -d '{"max_stocks": 10}'

# Full refresh
curl -X POST http://localhost:5001/api/database/refresh \
  -H "Content-Type: application/json" \
  -d '{"full": true}'
```

### Data Freshness

**High Priority** (Updated daily):
- Nifty 50 stocks
- High market cap (>10,000 Cr)
- Popular sectors (IT, Banking, Pharma)

**Medium Priority** (Updated weekly):
- Mid cap stocks
- Other sectors

**Low Priority** (Updated monthly):
- Small cap stocks
- Low volume stocks

---

## Screener Integration

### How It Works

**1. User visits** `/screener`

**2. Frontend calls** `GET /api/screener/presets`

**3. User selects preset** (e.g., "Value Investing")

**4. Backend tries:**
   - **First**: Database screener (all NSE/BSE stocks)
   - **Fallback**: File screener (user's portfolio)

**5. Returns results** with `source` field:
   - `"source": "database"` - Screened all stocks
   - `"source": "portfolio"` - Screened user's uploads

### Example Response

```json
{
  "status": "success",
  "results": [
    {
      "stock_name": "Reliance Industries Ltd.",
      "nse_code": "RELIANCE",
      "current_price": 2850.50,
      "pe_ttm": 28.5,
      "roe_annual_pct": 15.2,
      "market_cap": 1930000000000,
      "data_quality_score": 100
    }
  ],
  "metadata": {
    "preset_name": "Value Investing",
    "total_matches": 12,
    "total_stocks": 500,
    "match_rate": "2.4%"
  },
  "source": "database"
}
```

---

## Performance Optimization

### Database Indexing
All common filter fields are indexed for fast queries.

### Pagination
Use `limit` and `offset` for large result sets.

### Caching
- Database queries cached for 15 minutes
- Multi-source fetcher has built-in cache

### Batch Processing
- Enrich in batches of 10-20 stocks
- Rate limiting between sources
- Automatic retries

---

## Monitoring & Maintenance

### Check Database Health

```bash
# Get stats
curl http://localhost:5001/api/database/stats

# Check refresh logs
psql $POSTGRES_URL
SELECT * FROM data_refresh_log ORDER BY completed_at DESC LIMIT 10;
```

### Common Issues

**Issue: Low quality scores**
```bash
# Re-enrich problematic stocks
curl -X POST /api/database/enrich \
  -d '{"max_stocks": 50}'
```

**Issue: Stale data**
```bash
# Force refresh
curl -X POST /api/database/refresh \
  -d '{"full": true}'
```

**Issue: Database not initialized**
```bash
# Initialize
curl -X POST /api/database/init

# Populate
curl -X POST /api/database/populate
```

---

## Migration from File-Based

### Old System (File-Based)
```python
# Required Excel uploads
# Limited to user's stocks
# Manual refresh
```

### New System (Database)
```python
# No uploads needed for screener
# All NSE/BSE stocks available
# Auto-refresh via cron
# Fallback to files for portfolio analysis
```

### Backward Compatibility
✅ Portfolio uploads still work
✅ File-based processing unchanged
✅ Automatic fallback if database unavailable

---

## Cost Estimation

### Vercel Postgres (Neon)

**Free Tier:**
- 0.5 GB storage
- ~500 stocks with full data
- Perfect for Nifty 50 + 450 stocks
- Included with Vercel Pro

**Pro Tier** ($20/month):
- 10 GB storage
- ~10,000 stocks
- All NSE/BSE stocks
- Auto-scaling

### API Costs
All data sources used are free tier:
- yfinance: Free
- NSE: Free
- MoneyControl: Free (via pkscreener)
- Alpha Vantage: Free tier (500/day)

**Total Cost**: $0-20/month depending on stock count

---

## Troubleshooting

### Local Development

**Database file not found**
```bash
cd backend
python3 database/stock_populator.py
```

**Import errors**
```bash
pip install -r requirements.txt
```

**No stocks in database**
```bash
curl -X POST http://localhost:5001/api/database/populate
```

### Production

**Database connection failed**
- Check `POSTGRES_URL` environment variable
- Verify Vercel Postgres is created
- Check region compatibility

**Screener returns no results**
- Initialize database: `POST /api/database/init`
- Populate stocks: `POST /api/database/populate`
- Enrich data: `POST /api/database/enrich`

**Cron job not running**
- Check `vercel.json` has cron configuration
- Verify path is correct: `/api/database/refresh`
- Check Vercel dashboard > Cron logs

---

## Next Steps

### 1. Initialize Database
```bash
python3 backend/database/stock_populator.py
```

### 2. Start Development
```bash
python3 backend/app.py
```

### 3. Test Screener
```
Visit: http://localhost:3000/screener
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

### 5. Set Up Cron
Add to `vercel.json` and redeploy

---

## Summary

✅ **Built:**
- SQLite for local development
- Postgres for Vercel production
- Complete stock database schema
- Population & enrichment scripts
- Database management API
- Auto-fallback to portfolio mode

✅ **Benefits:**
- Screener works without uploads
- All NSE/BSE stocks available
- Auto-refresh capability
- Backward compatible
- Production-ready

✅ **Ready to Deploy:**
- Vercel configuration complete
- Environment variables documented
- Migration path clear
- Monitoring in place

🚀 **Your screener is now database-driven and ready for production!**
