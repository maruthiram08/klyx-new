# Klyx Production Deployment Guide
## Vercel (Frontend + API) + Render.com (Background Workers)

**Repository:** https://github.com/maruthiram08/klyx-new  
**Architecture:** Hybrid - Serverless API + Always-On Workers  
**Database:** Shared Vercel Postgres (Neon)  
**Total Cost:** **$0/month** (100% Free Tier)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL (Frontend + API)                     │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │   Next.js    │  │   Flask Serverless Functions       │  │
│  │  (React 19)  │  │  • Auth (JWT, login, register)     │  │
│  │              │  │  • Portfolio (add, remove, list)   │  │
│  │              │  │  • Debt Optimizer (scenarios)      │  │
│  │              │  │  • Screener (queries, filters)     │  │
│  │              │  │  • Stocks API (search, list)       │  │
│  └──────────────┘  └────────────────────────────────────┘  │
│                     ⚡ Fast responses (< 500ms)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              VERCEL POSTGRES (Shared Database)               │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │   User Data      │  │      Stock Data              │    │
│  │  • users         │  │  • stocks (2,221 enriched)   │    │
│  │  • user_portfolio│  │  • stock_metadata            │    │
│  │  • debt_scenarios│  │  • data_refresh_log          │    │
│  └──────────────────┘  └──────────────────────────────┘    │
│              256MB Free / $20/mo for 1GB                     │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                 RENDER.COM (Background Workers)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Flask Worker (Gunicorn, 4 workers)            │  │
│  │  • Stock Enrichment (20-30 min)                      │  │
│  │  • Database Population (15-30 min)                   │  │
│  │  • Daily Price Refresh                               │  │
│  │  • Weekly Full Enrichment                            │  │
│  │                                                       │  │
│  │  + Built-in Cron Jobs (no external service needed!)  │  │
│  │  + Never sleeps (with UptimeRobot pings)             │  │
│  │  + 750 hours/month FREE                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Vercel account (free tier)
- [x] Render.com account (free tier)
- [x] Local development environment working
- [x] Stock database enriched (2,221 stocks ✅)

---

## 🚀 Part 1: Vercel Setup (Frontend + API)

### Step 1.1: Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd /Users/maruthi/Desktop/MainDirectory/weekendanalysis\ tool

# Initialize Vercel project
vercel link
# Choose: Create new project
# Project name: klyx
# Framework preset: Next.js (auto-detected)
```

### Step 1.2: Create Vercel Postgres Database

**Via Vercel Dashboard:**

1. Go to https://vercel.com/dashboard
2. Select your project **klyx**
3. Click **Storage** tab
4. Click **Create Database**
5. Select **Postgres** (Neon)
6. Choose region: **Mumbai (ap-south-1)** or **Singapore (ap-southeast-1)**
7. Click **Create**
8. Copy connection string (starts with `postgresql://`)

**Environment Variables Auto-Created:**
- `POSTGRES_URL` - Full connection string with pooling
- `POSTGRES_URL_NON_POOLING` - Direct connection
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

### Step 1.3: Initialize Database Schema

```bash
# Pull environment variables locally
vercel env pull .env.local

# Extract POSTGRES_URL
cat .env.local | grep POSTGRES_URL=

# Set environment variable
export POSTGRES_URL="<paste_connection_string_here>"

# Connect and create schema
psql $POSTGRES_URL

# In psql prompt:
\i backend/database/schema.sql

# Verify tables
\dt

# Expected output:
#  users
#  user_portfolio
#  debt_scenarios
#  stocks
#  stock_metadata
#  data_refresh_log

# Exit
\q
```

### Step 1.4: Migrate Data to Vercel Postgres

```bash
# Run migration script
cd backend
export POSTGRES_URL="<paste_connection_string_here>"
python3 migrate_to_vercel_postgres.py

# Expected output:
# === Migrating User Data ===
# ✓ users: Migrated X rows
# ✓ user_portfolio: Migrated X rows
# ✓ debt_scenarios: Migrated X rows
#
# === Migrating Stock Data ===
# ✓ stocks: Migrated 2221 rows
# ✓ stock_metadata: Migrated X rows
# ✓ data_refresh_log: Migrated X rows
```

**Create migration script if not exists:**

<function_calls>
<invoke name="mcp__acp__Read">
<parameter name="file_path">/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/migrate_to_vercel_postgres.py