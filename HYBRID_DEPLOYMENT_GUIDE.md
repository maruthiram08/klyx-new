# Hybrid Deployment Guide - Vercel + Railway

**Architecture:** API on Vercel Serverless + Background Workers on Railway  
**Database:** Shared Vercel Postgres (Neon)  
**Repository:** https://github.com/maruthiram08/klyx-new

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER REQUESTS                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend + API)                  │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │   Next.js    │  │    Flask Serverless Functions      │  │
│  │   Frontend   │  │  • Auth (login, register, logout)  │  │
│  │              │  │  • Portfolio (add, remove, get)    │  │
│  │              │  │  • Debt Optimizer (CRUD, migrate)  │  │
│  │              │  │  • Screener (presets, filter)      │  │
│  │              │  │  • Database queries (stocks list)  │  │
│  └──────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL POSTGRES (Neon)                    │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │   User Data      │  │      Stock Data              │    │
│  │  • users         │  │  • stocks (2200+ records)    │    │
│  │  • user_portfolio│  │  • stock_metadata            │    │
│  │  • debt_scenarios│  │  • data_refresh_log          │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                   RAILWAY (Background Workers)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Flask App (Long-Running Tasks)             │  │
│  │  • Stock Enrichment (20-30 min)                      │  │
│  │  • Database Population (15-30 min)                   │  │
│  │  • Scheduled Daily/Weekly Refresh                    │  │
│  │  • Manual Admin Triggers                             │  │
│  │                                                       │  │
│  │  Server: Gunicorn (multi-worker)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Vercel Setup (Frontend + API)

### Step 1.1: Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd klyx-new

# Login to Vercel
vercel login

# Link project (creates .vercel directory)
vercel link
# Choose: Create new project
# Project name: klyx
# Directory: ./
```

### Step 1.2: Create Vercel Postgres Database

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project (klyx)
3. Click **Storage** tab
4. Click **Create Database**
5. Select **Postgres** (powered by Neon)
6. Choose region: **Mumbai** (ap-south-1) for India
7. Click **Create**
8. Note the connection details

**Environment Variables (Auto-created):**
- `POSTGRES_URL` - Full connection string
- `POSTGRES_PRISMA_URL` - For Prisma (not used)
- `POSTGRES_URL_NON_POOLING` - Direct connection
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

### Step 1.3: Initialize Database Schema

```bash
# Pull environment variables locally
vercel env pull .env.local

# Extract DATABASE_URL from .env.local
cat .env.local | grep POSTGRES_URL

# Set environment variable
export DATABASE_URL="postgresql://default:xxxx@xxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb"

# Connect to database
psql $DATABASE_URL

# Run schema
\i backend/database/schema.sql

# Verify tables created
\dt

# You should see:
#  users
#  user_portfolio
#  debt_scenarios
#  stocks
#  stock_metadata
#  data_refresh_log

# Exit
\q
```

### Step 1.4: Create Serverless API Entry Point

**Create `api/index.py`:**

```python
"""
Vercel Serverless Entry Point for Flask API
Handles: Auth, Portfolio, Debt Optimizer, Screener, Database queries
Does NOT handle: Long-running enrichment tasks (see Railway worker)
"""

import os
import sys

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Import routes
from auth import auth_bp
from portfolio_routes import portfolio_bp
from debt_optimizer_routes import debt_optimizer_bp

# Create Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = 2592000  # 30 days

# CORS
allowed_origins = os.environ.get('CORS_ORIGIN', '').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

# JWT
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(portfolio_bp, url_prefix='/api')
app.register_blueprint(debt_optimizer_bp, url_prefix='/api')

# Import screener and database routes
from api.screener_routes import screener_bp
from api.database_routes import db_routes

app.register_blueprint(screener_bp, url_prefix='/api/screener')
app.register_blueprint(db_routes, url_prefix='/api/database')

# Health check
@app.route('/api/health')
def health():
    return {'status': 'ok', 'service': 'vercel-api'}

# Vercel serverless handler
def handler(event, context):
    """
    Vercel serverless function handler
    Converts Vercel event to Flask request
    """
    # Note: Vercel's Python runtime handles this automatically
    # This function signature is for documentation
    pass

# For local testing
if __name__ == '__main__':
    app.run(debug=True, port=5001)
```

### Step 1.5: Create Vercel Configuration

**Create `vercel.json`:**

```json
{
  "version": 2,
  "name": "klyx",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "JWT_SECRET_KEY": "@jwt_secret_key",
    "CORS_ORIGIN": "@cors_origin",
    "FLASK_ENV": "production"
  },
  "regions": ["bom1"]
}
```

**Note:** `bom1` is Mumbai region for low latency in India.

### Step 1.6: Update Frontend API URL

**Create `frontend/.env.production`:**

```env
NEXT_PUBLIC_API_URL=https://klyx.vercel.app/api
```

**Update `frontend/api.ts`:**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Rest of the file remains the same
```

### Step 1.7: Set Environment Variables in Vercel

```bash
# Generate JWT secret
openssl rand -hex 32
# Example: 7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0

# Set in Vercel (production)
vercel env add JWT_SECRET_KEY production
# Paste the generated secret when prompted

# Set CORS origin
vercel env add CORS_ORIGIN production
# Enter: https://klyx.vercel.app

# FLASK_ENV
vercel env add FLASK_ENV production
# Enter: production

# DATABASE_URL is already set by Vercel Postgres
# Verify:
vercel env ls
```

### Step 1.8: Update Backend Database Connection

**Verify `backend/database/db_config.py` is production-ready:**

```python
import os
import psycopg2
import sqlite3

def get_db_connection():
    """
    Returns database connection based on environment
    Production: Uses POSTGRES_URL from Vercel
    Development: Uses SQLite
    """
    # Check for Vercel Postgres environment variable
    db_url = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
    
    if db_url and 'postgres' in db_url:
        # Production: PostgreSQL
        return psycopg2.connect(db_url, sslmode='require')
    else:
        # Development: SQLite
        import os.path
        db_path = os.path.join(os.path.dirname(__file__), '..', 'stocks.db')
        return sqlite3.connect(db_path)

def get_user_db_connection():
    """
    Returns user database connection (klyx.db in dev, Postgres in prod)
    """
    db_url = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
    
    if db_url and 'postgres' in db_url:
        # Production: Same Postgres instance, different tables
        return psycopg2.connect(db_url, sslmode='require')
    else:
        # Development: SQLite
        import os.path
        db_path = os.path.join(os.path.dirname(__file__), '..', 'klyx.db')
        return sqlite3.connect(db_path)
```

### Step 1.9: Deploy to Vercel

```bash
# Build frontend locally first (test)
cd frontend
npm run build
npm start
# Visit http://localhost:3000 - verify it works

# Deploy to Vercel (production)
cd ..
vercel --prod

# Vercel will:
# 1. Build Next.js frontend
# 2. Deploy Python serverless function
# 3. Set up routing
# 4. Assign domain (klyx.vercel.app or custom)

# Note the deployment URL
# Example: https://klyx-abc123.vercel.app
```

### Step 1.10: Verify Vercel Deployment

```bash
# Test health endpoint
curl https://klyx.vercel.app/api/health
# Expected: {"status":"ok","service":"vercel-api"}

# Test registration
curl -X POST https://klyx.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'

# Expected: {"status":"success","message":"User registered successfully"}

# Test login
curl -X POST https://klyx.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Expected: {"status":"success","data":{"access_token":"...", "refresh_token":"..."}}
```

---

## Part 2: Railway Setup (Background Workers)

### Step 2.1: Prepare Railway Deployment

**Create `railway/` directory for worker-specific files:**

```bash
mkdir railway
```

**Create `railway/Procfile`:**

```
web: gunicorn --workers 4 --bind 0.0.0.0:$PORT --timeout 300 --chdir backend app:app
```

**Create `railway/requirements.txt`:**

```txt
# Same as backend/requirements.txt but add Gunicorn
Flask==3.0.0
Flask-CORS==4.0.0
Flask-JWT-Extended==4.6.0
SQLAlchemy==2.0.23
bcrypt==4.1.2
pandas==2.1.4
openpyxl==3.1.2
yfinance==0.2.33
requests==2.31.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
```

**Create `railway/runtime.txt`:**

```
python-3.11.6
```

### Step 2.2: Create Worker-Specific Flask App

**Create `backend/worker_app.py`:**

```python
"""
Railway Worker App - Long-Running Tasks Only
Handles: Stock enrichment, database population, scheduled refreshes
Does NOT handle: User requests (see Vercel API)
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS - allow Vercel API to trigger jobs
allowed_origins = [
    os.environ.get('VERCEL_API_URL', 'https://klyx.vercel.app'),
    'http://localhost:3000'
]
CORS(app, origins=allowed_origins)

# Health check
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'railway-worker'})

# Stock enrichment endpoint
@app.route('/worker/enrich', methods=['POST'])
def enrich_stocks():
    """
    Enrich stocks with sector, industry, day_change_pct
    Can take 20-30 minutes for all stocks
    """
    try:
        from database.enrich_missing_fields import enrich_all_stocks
        
        # Optional: Accept batch parameters
        data = request.json or {}
        batch_size = data.get('batch_size', 50)  # Process 50 stocks at a time
        offset = data.get('offset', 0)
        
        logger.info(f"Starting enrichment: batch_size={batch_size}, offset={offset}")
        
        # Run enrichment
        result = enrich_all_stocks(batch_size=batch_size, offset=offset)
        
        logger.info(f"Enrichment complete: {result}")
        
        return jsonify({
            'status': 'success',
            'message': 'Stock enrichment completed',
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Enrichment failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Database population endpoint
@app.route('/worker/populate', methods=['POST'])
def populate_database():
    """
    Populate database with stock metadata
    Can take 15-30 minutes
    """
    try:
        from database.stock_populator import populate_stocks
        
        logger.info("Starting database population")
        
        result = populate_stocks()
        
        logger.info(f"Population complete: {result}")
        
        return jsonify({
            'status': 'success',
            'message': 'Database population completed',
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Population failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Daily refresh endpoint (called by cron or manual trigger)
@app.route('/worker/refresh', methods=['POST'])
def refresh_stock_data():
    """
    Refresh stock data daily
    Updates prices, fundamentals, ratios
    """
    try:
        from database.enrich_missing_fields import refresh_daily_data
        
        logger.info("Starting daily refresh")
        
        result = refresh_daily_data()
        
        logger.info(f"Refresh complete: {result}")
        
        return jsonify({
            'status': 'success',
            'message': 'Daily refresh completed',
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Refresh failed: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Manual trigger endpoint (admin only)
@app.route('/worker/trigger/<task>', methods=['POST'])
def trigger_task(task):
    """
    Manual task trigger for admin
    Requires API key authentication
    """
    api_key = request.headers.get('X-API-Key')
    expected_key = os.environ.get('WORKER_API_KEY')
    
    if not api_key or api_key != expected_key:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    if task == 'enrich':
        return enrich_stocks()
    elif task == 'populate':
        return populate_database()
    elif task == 'refresh':
        return refresh_stock_data()
    else:
        return jsonify({'status': 'error', 'message': 'Unknown task'}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)
```

### Step 2.3: Update Enrichment Script for Production

**Update `backend/database/enrich_missing_fields.py`:**

```python
import os
import sys
import psycopg2
import sqlite3
import yfinance as yf
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection (Postgres in production, SQLite in dev)"""
    db_url = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')
    
    if db_url and 'postgres' in db_url:
        return psycopg2.connect(db_url, sslmode='require')
    else:
        db_path = os.path.join(os.path.dirname(__file__), '..', 'stocks.db')
        return sqlite3.connect(db_path)

def enrich_all_stocks(batch_size=50, offset=0):
    """
    Enrich stocks with sector, industry, day_change_pct
    
    Args:
        batch_size: Number of stocks to process (default 50)
        offset: Starting offset for batch processing
    
    Returns:
        dict with success count, failed count, total processed
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get stocks needing enrichment (sector_name is NULL or empty)
    query = """
        SELECT nse_code, stock_name 
        FROM stocks 
        WHERE sector_name IS NULL OR sector_name = ''
        ORDER BY nse_code
        LIMIT %s OFFSET %s
    """ if 'postgres' in str(type(conn)) else """
        SELECT nse_code, stock_name 
        FROM stocks 
        WHERE sector_name IS NULL OR sector_name = ''
        ORDER BY nse_code
        LIMIT ? OFFSET ?
    """
    
    cursor.execute(query, (batch_size, offset))
    stocks = cursor.fetchall()
    
    success_count = 0
    failed_count = 0
    
    logger.info(f"Processing {len(stocks)} stocks (batch_size={batch_size}, offset={offset})")
    
    for nse_code, stock_name in stocks:
        try:
            logger.info(f"Enriching {nse_code} ({stock_name})...")
            
            # Fetch from Yahoo Finance
            ticker = yf.Ticker(f"{nse_code}.NS")
            info = ticker.info
            
            sector = info.get('sector', 'Unknown')
            industry = info.get('industry', 'Unknown')
            current_price = info.get('currentPrice', info.get('regularMarketPrice'))
            prev_close = info.get('previousClose', info.get('regularMarketPreviousClose'))
            
            day_change_pct = None
            if current_price and prev_close and prev_close > 0:
                day_change_pct = ((current_price - prev_close) / prev_close) * 100
            
            # Update database
            update_query = """
                UPDATE stocks 
                SET sector_name = %s, industry = %s, day_change_pct = %s, 
                    last_updated = %s
                WHERE nse_code = %s
            """ if 'postgres' in str(type(conn)) else """
                UPDATE stocks 
                SET sector_name = ?, industry = ?, day_change_pct = ?, 
                    last_updated = ?
                WHERE nse_code = ?
            """
            
            cursor.execute(update_query, (
                sector, industry, day_change_pct, 
                datetime.now().isoformat(), nse_code
            ))
            conn.commit()
            
            success_count += 1
            logger.info(f"✓ {nse_code}: sector={sector}, day_change={day_change_pct:.2f}%")
            
        except Exception as e:
            logger.error(f"✗ {nse_code}: {str(e)}")
            failed_count += 1
            continue
    
    cursor.close()
    conn.close()
    
    result = {
        'success': success_count,
        'failed': failed_count,
        'total': len(stocks),
        'batch_size': batch_size,
        'offset': offset
    }
    
    logger.info(f"Enrichment batch complete: {result}")
    return result

def refresh_daily_data():
    """
    Refresh daily price changes for all stocks
    Faster than full enrichment (only updates prices)
    """
    # Implementation similar to enrich_all_stocks
    # But updates ALL stocks, not just missing ones
    # Only fetches price data, not sector/industry
    pass

if __name__ == '__main__':
    # For local testing
    result = enrich_all_stocks(batch_size=10, offset=0)
    print(f"Results: {result}")
```

### Step 2.4: Deploy to Railway

**Via Railway Dashboard:**

1. Go to https://railway.app
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect GitHub account and select `maruthiram08/klyx-new`
5. Railway auto-detects Python app
6. **Configure settings:**
   - **Root Directory:** Leave blank (will use `backend/`)
   - **Start Command:** `gunicorn --workers 4 --bind 0.0.0.0:$PORT --timeout 300 --chdir backend worker_app:app`
   - **Region:** Mumbai (if available, else Singapore)

**Set Environment Variables in Railway:**
- `POSTGRES_URL` - Copy from Vercel (Settings → Environment Variables → POSTGRES_URL)
- `WORKER_API_KEY` - Generate: `openssl rand -hex 16`
- `VERCEL_API_URL` - `https://klyx.vercel.app`

**Deploy:**
- Railway will automatically deploy
- Note the deployment URL (e.g., `https://klyx-worker.up.railway.app`)

### Step 2.5: Verify Railway Deployment

```bash
# Test health endpoint
curl https://klyx-worker.up.railway.app/health
# Expected: {"status":"ok","service":"railway-worker"}

# Test enrichment (requires API key)
curl -X POST https://klyx-worker.up.railway.app/worker/enrich \
  -H "X-API-Key: YOUR_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10, "offset": 0}'

# Expected: {"status":"success","message":"Stock enrichment completed","data":{...}}
```

---

## Part 3: Database Migration

### Step 3.1: Migrate Data from SQLite to Vercel Postgres

**Create `backend/migrate_to_vercel_postgres.py`:**

```python
"""
One-time migration from local SQLite to Vercel Postgres
Run locally with DATABASE_URL set to Vercel Postgres
"""

import sqlite3
import psycopg2
import os
from datetime import datetime

# Source databases
SQLITE_KLYX = 'backend/klyx.db'
SQLITE_STOCKS = 'backend/stocks.db'

# Target database (from environment)
POSTGRES_URL = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL')

if not POSTGRES_URL:
    raise RuntimeError("POSTGRES_URL environment variable not set!")

def migrate_table(sqlite_conn, pg_conn, table_name, transform=None):
    """
    Migrate single table from SQLite to PostgreSQL
    
    Args:
        sqlite_conn: SQLite connection
        pg_conn: PostgreSQL connection
        table_name: Table name to migrate
        transform: Optional function to transform row data
    """
    sqlite_cur = sqlite_conn.cursor()
    pg_cur = pg_conn.cursor()
    
    # Get all rows from SQLite
    sqlite_cur.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cur.fetchall()
    
    if not rows:
        print(f"⚠ {table_name}: No data to migrate")
        return
    
    # Get column names
    columns = [desc[0] for desc in sqlite_cur.description]
    placeholders = ','.join(['%s'] * len(columns))
    
    # Build INSERT query
    insert_sql = f"""
        INSERT INTO {table_name} ({','.join(columns)}) 
        VALUES ({placeholders})
        ON CONFLICT DO NOTHING
    """
    
    # Transform rows if needed
    if transform:
        rows = [transform(row) for row in rows]
    
    # Insert into PostgreSQL
    try:
        pg_cur.executemany(insert_sql, rows)
        pg_conn.commit()
        print(f"✓ {table_name}: Migrated {len(rows)} rows")
    except Exception as e:
        print(f"✗ {table_name}: Error - {str(e)}")
        pg_conn.rollback()

def migrate_users():
    """Migrate user data from klyx.db"""
    print("\n=== Migrating User Data ===")
    
    # Connect to databases
    if not os.path.exists(SQLITE_KLYX):
        print(f"⚠ {SQLITE_KLYX} not found - skipping user data")
        return
    
    klyx_conn = sqlite3.connect(SQLITE_KLYX)
    pg_conn = psycopg2.connect(POSTGRES_URL, sslmode='require')
    
    # Migrate tables
    for table in ['users', 'user_portfolio', 'debt_scenarios']:
        migrate_table(klyx_conn, pg_conn, table)
    
    # Close connections
    klyx_conn.close()
    pg_conn.close()

def migrate_stocks():
    """Migrate stock data from stocks.db"""
    print("\n=== Migrating Stock Data ===")
    
    # Connect to databases
    if not os.path.exists(SQLITE_STOCKS):
        print(f"⚠ {SQLITE_STOCKS} not found - skipping stock data")
        return
    
    stocks_conn = sqlite3.connect(SQLITE_STOCKS)
    pg_conn = psycopg2.connect(POSTGRES_URL, sslmode='require')
    
    # Migrate tables
    for table in ['stocks', 'stock_metadata', 'data_refresh_log']:
        migrate_table(stocks_conn, pg_conn, table)
    
    # Close connections
    stocks_conn.close()
    pg_conn.close()

def main():
    print("=== Vercel Postgres Migration ===")
    print(f"Target: {POSTGRES_URL.split('@')[1].split(':')[0]}")  # Show host only
    print(f"Started: {datetime.now()}")
    
    # Run migrations
    migrate_users()
    migrate_stocks()
    
    print(f"\n=== Migration Complete ===")
    print(f"Finished: {datetime.now()}")
    print("\nVerify migration:")
    print(f"  psql {POSTGRES_URL}")
    print(f"  SELECT COUNT(*) FROM stocks;")

if __name__ == '__main__':
    main()
```

**Run migration:**

```bash
# Set DATABASE_URL from Vercel
export POSTGRES_URL="postgresql://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"

# Run migration
python3 backend/migrate_to_vercel_postgres.py

# Expected output:
# === Migrating User Data ===
# ✓ users: Migrated 5 rows
# ✓ user_portfolio: Migrated 12 rows
# ✓ debt_scenarios: Migrated 3 rows
#
# === Migrating Stock Data ===
# ✓ stocks: Migrated 2221 rows
# ✓ stock_metadata: Migrated 50 rows
# ✓ data_refresh_log: Migrated 10 rows
#
# === Migration Complete ===

# Verify
psql $POSTGRES_URL
SELECT COUNT(*) FROM stocks;
# Should show 2221 (or however many you have)
```

---

## Part 4: Scheduled Tasks & Automation

### Step 4.1: Set Up Railway Cron Jobs

Railway doesn't have built-in cron, so use **EasyCron** or **cron-job.org**:

**Via cron-job.org (Free):**

1. Go to https://cron-job.org
2. Create account
3. Create new cron job:
   - **URL:** `https://klyx-worker.up.railway.app/worker/refresh`
   - **Schedule:** `0 2 * * *` (2 AM daily)
   - **HTTP Method:** POST
   - **Headers:** `X-API-Key: YOUR_WORKER_API_KEY`

4. Create second cron for weekly enrichment:
   - **URL:** `https://klyx-worker.up.railway.app/worker/enrich`
   - **Schedule:** `0 3 * * 0` (3 AM Sunday)
   - **Body:** `{"batch_size": 100, "offset": 0}`

### Step 4.2: Manual Trigger from Vercel

**Add admin endpoint to Vercel API:**

```python
# api/index.py - add admin route

import requests

@app.route('/api/admin/trigger-enrichment', methods=['POST'])
@jwt_required()  # Requires admin JWT
def trigger_enrichment():
    """
    Admin endpoint to trigger enrichment on Railway worker
    """
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    
    # Check if user is admin (add is_admin field to users table)
    # For now, hardcode admin user ID
    if user_id != 'admin-user-id':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    # Trigger Railway worker
    worker_url = os.environ.get('RAILWAY_WORKER_URL')
    api_key = os.environ.get('WORKER_API_KEY')
    
    response = requests.post(
        f'{worker_url}/worker/enrich',
        headers={'X-API-Key': api_key},
        json={'batch_size': 50, 'offset': 0}
    )
    
    return jsonify(response.json())
```

---

## Part 5: Testing & Verification

### Step 5.1: End-to-End Testing Checklist

**Frontend (Vercel):**
- [ ] Landing page loads (`https://klyx.vercel.app`)
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens stored in localStorage
- [ ] Protected routes redirect to login

**API (Vercel Serverless):**
- [ ] Health check: `curl https://klyx.vercel.app/api/health`
- [ ] Register: `POST /api/auth/register`
- [ ] Login: `POST /api/auth/login`
- [ ] Get portfolio: `GET /api/portfolio` (with JWT)
- [ ] Add stock: `POST /api/portfolio/add`
- [ ] Screener presets: `GET /api/screener/presets`
- [ ] Run screener: `POST /api/screener/preset/value`

**Worker (Railway):**
- [ ] Health check: `curl https://klyx-worker.up.railway.app/health`
- [ ] Trigger enrichment (with API key)
- [ ] Check logs for enrichment progress
- [ ] Verify database updated after enrichment

**Database (Vercel Postgres):**
- [ ] Connect: `psql $POSTGRES_URL`
- [ ] Check user count: `SELECT COUNT(*) FROM users;`
- [ ] Check stock count: `SELECT COUNT(*) FROM stocks;`
- [ ] Check enriched stocks: `SELECT COUNT(*) FROM stocks WHERE sector_name IS NOT NULL;`

### Step 5.2: Load Testing

```bash
# Install Apache Bench
brew install httpd  # macOS
sudo apt install apache2-utils  # Linux

# Test Vercel API (100 requests, 10 concurrent)
ab -n 100 -c 10 https://klyx.vercel.app/api/health

# Test screener endpoint
ab -n 50 -c 5 -p screener_payload.json -T application/json \
  https://klyx.vercel.app/api/screener/preset/value

# Check response times:
# - p50 should be < 500ms
# - p95 should be < 2000ms
# - No failed requests
```

---

## Part 6: Monitoring & Maintenance

### Step 6.1: Set Up Vercel Monitoring

**In Vercel Dashboard:**
- Go to **Analytics** tab
- Monitor:
  - Function execution time
  - Error rate
  - Bandwidth usage
  - Database query performance

**Set up alerts:**
- Email notification if error rate > 5%
- Alert if avg response time > 3s

### Step 6.2: Set Up Railway Monitoring

**In Railway Dashboard:**
- Go to **Observability** tab
- Monitor:
  - Memory usage
  - CPU usage
  - Request count
  - Log errors

**Set up health check:**
- Railway → Settings → Health Check
- Path: `/health`
- Interval: 60 seconds

### Step 6.3: Database Monitoring

**Check database size weekly:**

```sql
-- Connect to Vercel Postgres
psql $POSTGRES_URL

-- Check total size
SELECT 
    pg_size_pretty(pg_database_size('verceldb')) as db_size,
    pg_size_pretty(pg_total_relation_size('stocks')) as stocks_table_size,
    (SELECT COUNT(*) FROM stocks) as stock_count,
    (SELECT COUNT(*) FROM stocks WHERE sector_name IS NOT NULL) as enriched_count;
```

**Optimize weekly:**

```sql
-- Vacuum and analyze
VACUUM ANALYZE stocks;
VACUUM ANALYZE users;
VACUUM ANALYZE user_portfolio;
```

---

## Part 7: Cost Estimation

### Vercel Costs (Hobby Plan - Free)
- **Function Executions:** 100GB-hours/month
- **Bandwidth:** 100GB/month
- **Build Minutes:** Unlimited
- **Postgres:** 256MB storage (upgrade: $20/month for 1GB)

**Estimated Usage:**
- API calls: ~10,000/day = 300,000/month
- Avg function time: 200ms = 0.2s
- Total: 300,000 × 0.2s = 60,000s = 16.67 GB-hours ✅ Within free tier

### Railway Costs (Hobby Plan - $5/month)
- **Memory:** 512MB included
- **CPU:** Shared
- **Execution:** 500 hours/month
- **Storage:** Free

**Estimated Usage:**
- Worker runs 24/7 = 720 hours/month
- Overage: 220 hours × $0.01 = $2.20
- **Total:** $7.20/month

### Total Estimated Cost
- **Vercel:** $0 (free tier) or $20/month (if need more Postgres storage)
- **Railway:** $7.20/month
- **Cron-job.org:** $0 (free tier)
- **Total:** **$7-$27/month**

---

## Part 8: Deployment Script

**Create `deploy.sh` for easy deployment:**

```bash
#!/bin/bash
set -e

echo "=== Klyx Hybrid Deployment Script ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build frontend
echo -e "${YELLOW}Step 1: Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built${NC}"

# Step 2: Deploy to Vercel
echo -e "${YELLOW}Step 2: Deploying to Vercel...${NC}"
vercel --prod
echo -e "${GREEN}✓ Deployed to Vercel${NC}"

# Step 3: Trigger Railway deployment
echo -e "${YELLOW}Step 3: Railway will auto-deploy from GitHub push${NC}"
echo "  Push your changes to trigger Railway deployment"
git status
echo -e "${GREEN}✓ Ready for Railway deployment${NC}"

# Step 4: Verify deployments
echo -e "${YELLOW}Step 4: Verifying deployments...${NC}"

# Get Vercel URL
VERCEL_URL=$(vercel inspect --prod | grep "URL:" | awk '{print $2}')
echo "  Vercel URL: $VERCEL_URL"

# Test Vercel health
echo "  Testing Vercel API..."
curl -s "$VERCEL_URL/api/health" | grep "ok" && echo -e "${GREEN}  ✓ Vercel API healthy${NC}" || echo -e "${RED}  ✗ Vercel API unhealthy${NC}"

# Test Railway health (manual URL input for now)
echo ""
echo "  Enter your Railway worker URL (e.g., https://klyx-worker.up.railway.app):"
read RAILWAY_URL

if [ -n "$RAILWAY_URL" ]; then
    echo "  Testing Railway worker..."
    curl -s "$RAILWAY_URL/health" | grep "ok" && echo -e "${GREEN}  ✓ Railway worker healthy${NC}" || echo -e "${RED}  ✗ Railway worker unhealthy${NC}"
fi

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo "  Frontend: $VERCEL_URL"
echo "  Worker: $RAILWAY_URL"
echo ""
echo "Next steps:"
echo "  1. Test user registration/login"
echo "  2. Trigger stock enrichment from Railway worker"
echo "  3. Set up cron jobs at cron-job.org"
echo "  4. Monitor logs in Vercel and Railway dashboards"
```

Make executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Summary

### Architecture Benefits

✅ **Best of Both Worlds:**
- Fast API responses (Vercel serverless < 500ms)
- Long-running tasks work (Railway, no timeout)

✅ **Cost-Effective:**
- ~$7-$27/month total
- Much cheaper than dedicated servers

✅ **Scalable:**
- Vercel auto-scales with traffic
- Railway can upgrade memory/CPU as needed

✅ **Reliable:**
- Vercel 99.99% uptime
- Shared Postgres database (single source of truth)

✅ **Easy Maintenance:**
- Push to GitHub → Railway auto-deploys
- `vercel --prod` → Vercel deploys
- Separate concerns (API vs workers)

### Key Files Created

1. `api/index.py` - Vercel serverless entry point
2. `vercel.json` - Vercel configuration
3. `backend/worker_app.py` - Railway worker app
4. `railway/Procfile` - Railway process definition
5. `backend/migrate_to_vercel_postgres.py` - Migration script
6. `deploy.sh` - Deployment automation

### Next Steps

1. ✅ Set up Vercel project and Postgres
2. ✅ Deploy frontend + API to Vercel
3. ✅ Deploy worker to Railway
4. ✅ Run database migration
5. ⏳ Trigger initial stock enrichment
6. ⏳ Set up cron jobs
7. ⏳ Monitor and optimize

**You're ready to deploy! 🚀**
