# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🆕 Recent Major Updates (December 2025)

### Authentication System ✅
- **Email/password authentication** with JWT tokens (access: 1h, refresh: 30d)
- **Backend**: `auth.py` routes, `User` model in `models.py`
- **Frontend**: `AuthContext.tsx`, login/signup/forgot-password pages
- **Database**: `users` table in `klyx.db`
- **Security**: bcrypt password hashing, JWT refresh token rotation

### Portfolio Management ✅
- **Migrated from localStorage to database**
- **Uses Stock Name as primary identifier** (not NSE Code)
- **Backend**: `portfolio_routes.py` - GET/POST/DELETE endpoints
- **Frontend**: Updated `portfolio/page.tsx` and `stocks/page.tsx`
- **Database**: `user_portfolio` table with user_id and stock_name
- **Features**: Add/remove stocks, cloud sync across devices

### Debt Optimizer ✅
- **Migrated from localStorage to database**
- **Backend**: `debt_optimizer_routes.py` - 8 API endpoints
- **Frontend**: `debtStorageAPI.ts` (new), updated `debt-optimizer/page.tsx`
- **Database**: `debt_scenarios` table with JSON debt storage
- **Features**: Auto-save (500ms debounce), named scenarios, localStorage migration

### Stock Data Enrichment ⏳
- **Enrichment script**: `database/enrich_missing_fields.py`
- **Data sources**: yfinance for sector, industry, day_change_pct
- **Status**: Currently running (674/2221 stocks enriched - 30%)
- **Location**: Running in terminal, check progress with SQL queries

### Screener Improvements ✅
- **Field transformation**: Database snake_case → Frontend format ("NSE Code", "Day change %")
- **Search capability**: Can now search stocks by name or NSE code
- **Backend**: Updated `screener_db_service.py` with `_transform_to_frontend_format()`
- **API**: Added search parameter to `/api/database/stocks`

---

## Project Overview

**Repository:** https://github.com/maruthiram08/klyx-new

Weekend Analysis Tool (Klyx) is a full-stack financial planning and stock analysis application with three primary features:

1. **Portfolio Management** - Save and track your favorite stocks with real-time data and analysis
2. **Stock Screener** - Filter and discover stocks from complete NSE/BSE database using preset strategies or custom criteria
3. **Debt Optimizer** - Create strategic plans to pay off debts faster using Snowball, Avalanche, or Ski methods

The application consists of a Flask backend (Python) that handles data processing, enrichment, financial analysis, authentication, and database management, paired with a Next.js frontend (TypeScript/React) for data visualization, interactive screening, and financial planning tools.

## Architecture

### High-Level Data Flow

**Portfolio Analysis Flow:**
1. **Data Upload** → User uploads Excel files via frontend (technicals, forecasts, fundamentals, trendlyne scores)
2. **Data Cleaning** (`clean_data.py`) → Merges multiple Excel sources, removes duplicates, uses "Stock Name" as unique key
3. **Data Enrichment** (`enrich_data.py`) → Fetches missing balance sheet data (Assets, Debt, Equity) from Yahoo Finance
4. **Insight Generation** (`generate_insights.py`) → Applies financial analysis logic to calculate ratios (ROE, Current Ratio, Debt-to-Equity, etc.)
5. **Dashboard Display** → Frontend presents analyzed data with categorized insights

**Screener Flow:**
1. **Database Initialization** → `stock_populator.py` fetches NSE/BSE stock lists and populates SQLite/PostgreSQL database
2. **Data Enrichment** → Multi-source data service enriches stocks with fundamentals from NSE, Yahoo Finance, MoneyControl, Alpha Vantage
3. **Screening** → User selects preset strategy or builds custom filters via frontend
4. **Query Execution** → Database screener (`screener_db_service.py`) runs SQL queries with filters
5. **Results Display** → Frontend shows matched stocks with financial data and quality scores

### Backend Structure (`/backend`)

**Core Pipeline Scripts:**
- `clean_data.py` - Unifies multiple Excel sources into master file
- `enrich_data.py` - Enriches data using yfinance for balance sheet metrics
- `generate_insights.py` - Calculates financial ratios and generates insights
- `app.py` - Flask API server coordinating the pipeline

**API Endpoints:**

*Authentication (JWT-based):*
- `/api/auth/register` - User registration with email/password
- `/api/auth/login` - Login and receive access/refresh tokens
- `/api/auth/logout` - Logout (client-side token removal)
- `/api/auth/me` - Get current user profile (requires JWT)
- `/api/auth/refresh` - Refresh access token using refresh token

*Portfolio Management (requires JWT):*
- `GET /api/portfolio` - Get user's saved stocks (returns stock_name array)
- `POST /api/portfolio/add` - Add stock to portfolio (body: {stock_name})
- `DELETE /api/portfolio/remove` - Remove stock from portfolio (body: {stock_name})

*Debt Optimizer (requires JWT):*
- `GET /api/debt-optimizer/current` - Get current working scenario
- `PUT /api/debt-optimizer/current` - Save/update current scenario (auto-save)
- `DELETE /api/debt-optimizer/current` - Clear current scenario
- `GET /api/debt-optimizer/scenarios` - Get all saved scenarios
- `POST /api/debt-optimizer/scenarios` - Create new saved scenario (body: {name, debts, monthlyBudget})
- `GET /api/debt-optimizer/scenarios/:id` - Get specific scenario by ID
- `DELETE /api/debt-optimizer/scenarios/:id` - Delete scenario by ID
- `POST /api/debt-optimizer/migrate` - One-time migration from localStorage

*Portfolio Analysis:*
- `/api/upload` - Accepts Excel file uploads
- `/api/use_sample` - Loads test data files (prefixed with `test_`)
- `/api/process` - Executes the 3-step pipeline (clean → enrich → insights)
- `/api/results` - Returns final analysis data
- `/api/clear` - Removes generated files and uploaded data
- `/api/stock/<symbol>/fundamentals` - Fetches fundamentals via `market_data_service`
- `/api/verify_symbols` - Validates stock symbols across files
- `/api/submit_corrections` - Applies symbol corrections

*Stock Screener:*
- `/api/screener/presets` - Returns list of 8 preset screening strategies
- `/api/screener/preset/<name>` - Applies a preset strategy (value, growth, momentum, dividend, quality, garp, breakout, low_volatility)
- `/api/screener/filter` - Applies custom filters with logic operators

*Database Management:*
- `/api/database/init` - Initializes database schema
- `/api/database/populate` - Populates database with stock metadata
- `/api/database/enrich` - Enriches stocks with fundamental data
- `/api/database/stats` - Returns database statistics
- `/api/database/stocks` - Lists stocks with pagination, filters, and search (query param: search)
- `/api/database/refresh` - Refreshes stock data from sources
- `/api/database/sectors` - Returns sector breakdown

**Route Modules (`/backend`):**
- `auth.py` - Authentication routes (register, login, logout, refresh, me)
- `portfolio_routes.py` - Portfolio management routes (add, remove, get portfolio)
- `debt_optimizer_routes.py` - Debt optimizer scenario management (CRUD + migration)

**Services (`/backend/services`):**
- `multi_source_data_service.py` - Fetches data from multiple sources (NSE, Yahoo Finance, MoneyControl, Alpha Vantage) with quality scoring
- `screener_service.py` - File-based screener for portfolio analysis
- `screener_db_service.py` - Database-driven screener for all stocks (includes field transformation)
- `market_data_service.py` - Integrates with external market data APIs (BharatFinance)
- `verification_service.py` - Validates and corrects stock symbols across Excel files

**Database Layer (`/backend/database`):**
- `schema.sql` - PostgreSQL/SQLite schema for stocks, metadata, refresh logs
- `db_config.py` - Database configuration and connection management (dual-mode: SQLite dev, Postgres production)
- `stock_populator.py` - Automated stock list fetching and database population
- `enrich_missing_fields.py` - Enriches stocks with sector, industry, and day_change_pct from Yahoo Finance

**Database Files:**
- `backend/klyx.db` - SQLite database for users, portfolio, and debt scenarios (development)
- `backend/stocks.db` - SQLite database for stock data and screener (development)
- Production: Vercel Postgres for both user data and stock data

**Data Storage:**
- Input files: `backend/datasource/` (Excel files for portfolio analysis)
- Generated files: `backend/nifty50_unified_master.xlsx`, `backend/nifty50_enriched.xlsx`, `backend/nifty50_final_analysis.xlsx`

**Financial Analysis (`/backend/myskills`):**
- `financial_analysis.md` - Documents the financial ratio calculation framework
- `interpret_ratios.py` - Contains ratio calculation and interpretation logic
- `market_analysis.md` - Future roadmap for technical analysis (RSI, MACD, sentiment)

### Frontend Structure (`/frontend`)

**Framework:** Next.js 16 (App Router) with TypeScript, Tailwind CSS 4, React 19

**Component Architecture:**
- `app/` - Next.js App Router pages
  - `page.tsx` - Landing page (not authenticated)
  - `dashboard/page.tsx` - Main dashboard (authenticated)
  - `portfolio/page.tsx` - User's saved stock portfolio (authenticated)
  - `stocks/page.tsx` - Browse and add stocks to portfolio (authenticated)
  - `screener/page.tsx` - Stock screener interface with preset strategies
  - `debt-optimizer/page.tsx` - Debt payoff planning tool (authenticated)
  - `login/page.tsx` - Login page
  - `signup/page.tsx` - User registration page
  - `forgot-password/page.tsx` - Password reset page
  - `layout.tsx` - Root layout with navigation
- `components/` - Organized by atomic design principles:
  - `ui/` - Atoms (Button, Typography, Badge, Container, MarkdownRenderer, FinancialTable, DataQualityBadge, Input, Select, NumberInput)
  - `molecules/` - Feature cards, stat cards, newsletter form
  - `organisms/` - Hero section, footer, Header, Sidebar
  - `debt-optimizer/` - DebtForm, DebtList, BudgetInput, MethodComparison, PaymentSchedule, DebtSummaryCard
  - Top-level: StockCard, StockDetails, DashboardGrid, VerificationModal
- `contexts/` - React Context providers
  - `AuthContext.tsx` - Authentication state management (JWT tokens, login/logout)
- `utils/` - Utility functions and helpers
  - `debtStorageAPI.ts` - Debt optimizer database API client
  - `debtCalculations.ts` - Snowball, Avalanche, Ski algorithms
  - `debtStorage.ts` - Legacy localStorage functions (deprecated)
- `types/` - TypeScript type definitions
  - `debt.ts` - Debt optimizer types (Debt, OptimizationResult, PaymentSchedule)
- `types.ts` - TypeScript type definitions for stock data (includes quality scores)
- `api.ts` - API client for backend communication (portfolio, stocks, screener)

**State Management:** Local component state (no external state library)

**Styling:** Tailwind CSS with custom configuration in `tailwindcss` v4

## Development Commands

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies (including database support)
pip3 install -r requirements.txt
pip3 install psycopg2-binary  # For PostgreSQL support

# Run Flask development server (runs on http://localhost:5001)
python3 app.py

# Initialize and populate stock database (REQUIRED for screener)
python3 database/stock_populator.py

# Test individual portfolio analysis pipeline steps
python3 clean_data.py
python3 enrich_data.py
python3 generate_insights.py

# Run API tests
python3 test_api.py
python3 test_api_toggle.py
```

## Important Implementation Details

### Data Processing Logic

**Dual-Mode Operation:**
- **Portfolio Analysis:** File-based, user uploads Excel files for personal portfolio analysis
- **Stock Screener:** Database-driven, operates on all NSE/BSE stocks independently of user uploads

**File Selection Strategy (Portfolio Analysis):**
- `clean_data.py` implements smart file selection: if user-uploaded files exist in `datasource/`, test files (prefixed with `test_`) are automatically skipped
- Test files are only used when no user files are present

**Data Enrichment Strategies:**

*Portfolio (File-based):*
- High-quality Excel data is preferred for Profitability/Valuation metrics
- Yahoo Finance (`yfinance`) fills gaps for Balance Sheet data (Assets, Debt, Equity) missing from Excel sources
- This prevents overwriting clean Excel data with potentially stale Yahoo data

*Screener (Database-driven):*
- Multi-source data service fetches from 4 sources: NSE, Yahoo Finance, MoneyControl, Alpha Vantage
- Data quality scoring (0-100%) tracks completeness and freshness
- Smart fallback chain tries sources in priority order until high quality achieved (≥80%)
- Database stores source attribution and last updated timestamps

**Symbol Handling:**
- Stock symbols may vary between data sources (e.g., "RELIANCE" vs "RELIANCE.NS")
- `verification_service.py` provides symbol validation and correction capabilities
- Frontend offers `VerificationModal` for user-driven symbol corrections
- Database normalizes symbols to NSE format (e.g., "RELIANCE.NS")

### API Integration

The backend integrates with multiple external services:

**Portfolio Analysis:**
- **yfinance** - Primary source for balance sheet data enrichment
- **BharatFinance** (via `market_data_service.py`) - Alternative market data source

**Stock Screener:**
- **NSE India** - Primary source for stock lists and real-time data
- **Yahoo Finance** - Comprehensive financial data with good coverage
- **MoneyControl** - Indian market specialist (requires API key)
- **Alpha Vantage** - Global market data (requires API key)

All integrations include:
- Fallback mechanisms for when sources are unavailable
- Rate limiting to respect API quotas
- Error handling and retry logic
- Data quality validation

### Flask Configuration

- CORS enabled for `localhost:3000` (Next.js frontend)
- Runs on port `5001` to avoid conflicts
- Database routes registered via Blueprint architecture (`api/database_routes.py`)
- Screener endpoints use database-first approach with file-based fallback
- Absolute paths are hardcoded in some scripts (e.g., `/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/`) - these may need updating when moving the repository

### Database Configuration

**Development:**
- Uses SQLite at `backend/stocks.db`
- No external dependencies required
- Automatically created on first initialization
- Good for local development and testing

**Production (Vercel):**
- Uses Vercel Postgres (Neon) via `DATABASE_URL` environment variable
- Requires Vercel Postgres add-on
- Schema compatible with both SQLite and PostgreSQL
- Connection pooling handled by psycopg2

**Schema:**
- Main table: `stocks` (50+ fields covering financials, ratios, technicals)
- Supporting tables: `stock_metadata`, `data_refresh_log`, `user_screeners`
- Indexes on: sector, market_cap, pe_ttm, roe_annual_pct for fast queries

### Frontend-Backend Communication

- Frontend uses `api.ts` client module to communicate with Flask backend
- All API calls expect JSON responses with `{status: "success"|"error", message: string, data?: any}` structure
- File uploads use FormData with key `files[]`

## Testing

**Backend Tests:**
- `test_*.py` files in `/backend` for various components
- `test_api.py` - Tests Flask API endpoints
- `test_yfinance.py` - Validates Yahoo Finance integration
- `test_enrichment_logic.py` - Tests data enrichment logic

**Sample Data:**
Test files in `backend/datasource/` prefixed with `test_`:
- `test_nifty50 technicals.xlsx`
- `test_nifty50-forecasts.xlsx`
- `test_nifty50-fundamentals.xlsx`
- `test_nifty50-trendlynescores, benchmarks.xlsx`

## Known Issues & Considerations

1. **Hardcoded Paths:** Several Python scripts contain absolute paths specific to the original development environment. Search for `/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/` when deploying or relocating.

2. **Working Directory:** The Flask app expects to be run from the `/backend` directory. Relative paths in pipeline scripts assume this.

3. **Database Initialization Required:** The stock screener requires database initialization before use. Run `python3 database/stock_populator.py` after first setup. This is a one-time operation that takes 15-30 minutes.

4. **Data File Cleanup:** The `/api/clear` endpoint only removes non-test Excel files for portfolio analysis. Test files (prefixed with `test_`) are preserved. Database is not affected.

5. **Symbol Variations:** Stock symbols from different data providers may not match. Always verify symbols when integrating new data sources. Database normalizes to NSE format.

6. **API Rate Limits:** Multi-source data service respects rate limits. Initial database population may take time due to sequential API calls with delays.

7. **Port Conflicts:** If port 5001 shows "already in use", kill existing Flask processes with `pkill -9 -f "python3 app.py"` before restarting.

8. **Reference Materials:** The `kubera_reference/` directory contains external reference implementations and Claude Code skills examples - these are not part of the main application but serve as documentation and inspiration.

## Environment Variables

**Optional Configuration:**
Create `backend/config_local.py` to override defaults:

```python
# API Keys (optional but recommended for better data quality)
ALPHA_VANTAGE_API_KEY = "your_key_here"
MONEYCONTROL_API_KEY = "your_key_here"  # If available

# Database (auto-detected, can override)
DATABASE_URL = "postgresql://user:pass@host:port/db"  # For production
```

**Production Environment Variables (Vercel):**
- `DATABASE_URL` - Vercel Postgres connection string (required)
- `ALPHA_VANTAGE_API_KEY` - Optional, improves data quality
- `MONEYCONTROL_API_KEY` - Optional, for Indian market data

## Documentation

**Quick Start:**
- `QUICK_START.md` - 3-step quick start guide for both features

**Feature Guides:**
- `SCREENER_GUIDE.md` - Complete screener usage documentation with all 8 preset strategies
- `RELIABLE_DATA_SOURCES.md` - Multi-source data system guide with troubleshooting

**Setup Guides:**
- `DATABASE_SETUP.md` - Comprehensive database setup for local and Vercel deployment
- `DATABASE_SCREENER_COMPLETE.md` - Complete screener feature overview and architecture
- `FEATURES_UPDATE.md` - Summary of major features and combined workflows

**Development:**
- `AI_AGENT_HANDOFF.md` - Session history, pending tasks, and next steps for AI agents
- `backlog.md` - Task backlog and feature roadmap

## Future Roadmap

From `backlog.md`:
- Custom screener builder UI (currently API-only)
- Market Analysis Skill: Implement Technical Analysis framework (RSI, MACD)
- Sentiment Analysis: News sentiment integration (noted in `market_analysis.md`)
- Automated daily data refresh via Vercel Cron Jobs
- User-saved screener presets
- Export to PDF/Excel with charts
- Portfolio comparison with screener results
- Alert system for stocks matching criteria
