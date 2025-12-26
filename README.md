# Klyx - Smart Financial Tools

**Repository:** https://github.com/maruthiram08/klyx-new

A full-stack financial planning and stock analysis platform built with Next.js and Flask.

## Features

### 🎯 Portfolio Management
- Save and track your favorite stocks
- Real-time stock data with sector and price changes
- Add/remove stocks with cloud sync across devices
- User authentication with secure JWT tokens

### 📊 Stock Screener
- Filter from complete NSE/BSE stock database
- 8 preset screening strategies:
  - Value Investing
  - Growth Stocks
  - Momentum Trading
  - Dividend Income
  - Quality Stocks
  - GARP (Growth at Reasonable Price)
  - Breakout Stocks
  - Low Volatility
- Custom filters with advanced criteria
- Multi-source data enrichment (NSE, Yahoo Finance, MoneyControl, Alpha Vantage)

### 💳 Debt Optimizer
- Strategic debt payoff planning
- Three optimization methods:
  - **Snowball**: Pay smallest debts first (psychological wins)
  - **Avalanche**: Pay highest interest first (maximum savings)
  - **Ski**: Smart hybrid approach
- Support for credit cards and loans (personal, home, car, education)
- Month-by-month payment schedules
- Save multiple scenarios with cloud sync
- Auto-save with 500ms debounce

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React icons

**Backend:**
- Flask (Python)
- SQLAlchemy ORM
- SQLite (development) / PostgreSQL (production)
- JWT authentication with bcrypt
- yfinance for stock data enrichment

**Databases:**
- `klyx.db` - User accounts, portfolio, debt scenarios
- `stocks.db` - Stock data and screener (2200+ stocks)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/maruthiram08/klyx-new.git
cd klyx-new
```

2. **Backend Setup**
```bash
cd backend

# Install Python dependencies
pip3 install -r requirements.txt

# Initialize databases (creates klyx.db and stocks.db)
python3 -c "from models import db; db.create_all()"

# Populate stock database (takes 15-30 minutes, one-time operation)
python3 database/stock_populator.py

# Optional: Enrich stocks with sector and price data
python3 database/enrich_missing_fields.py

# Start Flask server (runs on http://localhost:5001)
python3 app.py
```

3. **Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

4. **Access the application**
- Open http://localhost:3000 in your browser
- Create an account to start using the features

## Project Structure

```
klyx-new/
├── backend/
│   ├── app.py                          # Flask application entry point
│   ├── models.py                       # Database models (User, Portfolio, DebtScenario)
│   ├── auth.py                         # Authentication routes
│   ├── portfolio_routes.py             # Portfolio management API
│   ├── debt_optimizer_routes.py        # Debt optimizer API
│   ├── database/
│   │   ├── schema.sql                  # Database schema
│   │   ├── stock_populator.py          # Stock data initialization
│   │   └── enrich_missing_fields.py    # Stock enrichment script
│   ├── services/
│   │   ├── screener_db_service.py      # Database screener logic
│   │   ├── multi_source_data_service.py # Multi-source data fetching
│   │   └── verification_service.py     # Symbol validation
│   └── datasource/                     # Excel files for portfolio analysis
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── dashboard/page.tsx          # Main dashboard
│   │   ├── portfolio/page.tsx          # Portfolio management
│   │   ├── stocks/page.tsx             # Browse stocks
│   │   ├── screener/page.tsx           # Stock screener
│   │   ├── debt-optimizer/page.tsx     # Debt planning tool
│   │   ├── login/page.tsx              # Login
│   │   └── signup/page.tsx             # Registration
│   ├── components/
│   │   ├── ui/                         # Reusable UI components
│   │   ├── debt-optimizer/             # Debt optimizer components
│   │   └── Header.tsx, Sidebar.tsx     # Layout components
│   ├── contexts/
│   │   └── AuthContext.tsx             # Authentication state
│   ├── utils/
│   │   ├── debtStorageAPI.ts           # Debt optimizer API client
│   │   ├── debtCalculations.ts         # Debt algorithms
│   │   └── api.ts                      # Main API client
│   └── types/
│       └── debt.ts                     # TypeScript types
│
└── docs/                               # Documentation files
```

## Authentication

The application uses JWT-based authentication:

- **Access Token**: 1 hour expiry
- **Refresh Token**: 30 days expiry
- **Password Hashing**: bcrypt with salt rounds
- **Storage**: Tokens stored in localStorage
- **Protected Routes**: Portfolio, Stocks, Debt Optimizer require login

### API Authentication

Protected endpoints require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

## Database Schema

### Users (`klyx.db`)
```sql
users:
  - id (UUID, primary key)
  - email (unique)
  - password_hash (bcrypt)
  - name
  - created_at, updated_at

user_portfolio:
  - id (auto-increment)
  - user_id (foreign key → users.id)
  - stock_name (e.g., "Reliance Industries")
  - added_at
  - UNIQUE(user_id, stock_name)

debt_scenarios:
  - id (auto-increment)
  - user_id (foreign key → users.id)
  - name (scenario name)
  - debts (JSON string)
  - monthly_budget (float)
  - is_current (boolean)
  - created_at, updated_at
```

### Stocks (`stocks.db`)
```sql
stocks:
  - nse_code (primary key, e.g., "RELIANCE.NS")
  - stock_name (e.g., "Reliance Industries")
  - sector_name, industry
  - market_cap, pe_ttm, pb_ratio
  - roe_annual_pct, current_ratio
  - debt_to_equity, day_change_pct
  - ... (50+ financial metrics)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login (returns JWT tokens)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (requires JWT)
- `POST /api/auth/refresh` - Refresh access token

### Portfolio Management (requires JWT)
- `GET /api/portfolio` - Get user's saved stocks
- `POST /api/portfolio/add` - Add stock (body: `{stock_name}`)
- `DELETE /api/portfolio/remove` - Remove stock (body: `{stock_name}`)

### Debt Optimizer (requires JWT)
- `GET /api/debt-optimizer/current` - Get current working scenario
- `PUT /api/debt-optimizer/current` - Save current scenario (auto-save)
- `DELETE /api/debt-optimizer/current` - Clear current scenario
- `GET /api/debt-optimizer/scenarios` - Get all saved scenarios
- `POST /api/debt-optimizer/scenarios` - Create new scenario (body: `{name, debts, monthlyBudget}`)
- `GET /api/debt-optimizer/scenarios/:id` - Get scenario by ID
- `DELETE /api/debt-optimizer/scenarios/:id` - Delete scenario
- `POST /api/debt-optimizer/migrate` - Migrate from localStorage

### Stock Screener
- `GET /api/screener/presets` - List all preset strategies
- `POST /api/screener/preset/:name` - Apply preset strategy
- `POST /api/screener/filter` - Apply custom filters

### Database Management
- `GET /api/database/stocks` - List stocks (supports pagination, filters, search)
- `GET /api/database/stats` - Database statistics
- `GET /api/database/sectors` - Sector breakdown
- `POST /api/database/init` - Initialize database
- `POST /api/database/populate` - Populate stocks
- `POST /api/database/enrich` - Enrich stock data

## Development

### Running Tests

**Backend:**
```bash
cd backend
python3 test_api.py
python3 test_yfinance.py
python3 test_enrichment_logic.py
```

**Frontend:**
```bash
cd frontend
npm run lint
```

### Environment Variables

Create `backend/config_local.py` for optional configuration:
```python
# API Keys (optional, improves data quality)
ALPHA_VANTAGE_API_KEY = "your_key_here"
MONEYCONTROL_API_KEY = "your_key_here"

# JWT Secret (auto-generated if not provided)
JWT_SECRET_KEY = "your_secret_key"

# Database URL (auto-detected)
DATABASE_URL = "postgresql://user:pass@host:port/db"  # For production
```

### Port Configuration
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

If port 5001 is in use:
```bash
pkill -9 -f "python3 app.py"
```

## Key Features Explained

### Stock Portfolio
- Uses **Stock Name** as primary identifier (not NSE code)
- Search by stock name or NSE code in stocks page
- Real-time sector and price change data (enriched via yfinance)
- Cloud sync: Portfolio persists across devices

### Debt Optimizer

**Supported Debt Types:**
1. **Credit Cards**
   - Outstanding Balance (₹)
   - Monthly Interest Rate (%)
   - Minimum Payment (₹)

2. **Loans** (Personal, Home, Car, Education)
   - Outstanding Principal (₹)
   - Annual Interest Rate (%)
   - EMI Amount (₹)
   - Remaining Tenure (months)

**Optimization Methods:**
- **Snowball**: Pays smallest balance first for psychological motivation
- **Avalanche**: Pays highest interest first for maximum savings
- **Ski**: Smart hybrid balancing psychology and math

**Features:**
- Month-by-month payment schedules
- Total interest comparison across methods
- Auto-save every 500ms (debounce)
- Save multiple named scenarios
- One-click migration from localStorage to database

### Stock Screener

**Preset Strategies:**
1. **Value Investing**: Low P/E, P/B; high dividend yield
2. **Growth Stocks**: High revenue/earnings growth
3. **Momentum**: Strong recent price performance
4. **Dividend Income**: High dividend yield and payout ratio
5. **Quality**: High ROE, low debt
6. **GARP**: Growth at reasonable P/E
7. **Breakout**: Technical breakout patterns
8. **Low Volatility**: Stable, low-beta stocks

**Data Quality:**
- Multi-source enrichment (NSE, Yahoo, MoneyControl, Alpha Vantage)
- Quality scoring (0-100%) tracked per stock
- Smart fallback chain for missing data
- Last updated timestamps

## Known Limitations

1. **Stock Enrichment**: Initial enrichment of all 2200+ stocks can take 20-30 minutes (one-time operation)
2. **API Rate Limits**: Yahoo Finance has rate limits; enrichment uses delays to prevent blocking
3. **Symbol Variations**: Different sources use different formats (RELIANCE vs RELIANCE.NS)
4. **Hardcoded Paths**: Some scripts have absolute paths - search for `/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/` when relocating
5. **Working Directory**: Flask app must run from `/backend` directory

## Production Deployment

**Note:** Flask's built-in development server (`app.run()`) is not production-ready.

For Vercel deployment:
- Frontend deploys automatically via Next.js
- Backend requires WSGI server (e.g., Gunicorn)
- Database migration from SQLite to Vercel Postgres required
- See deployment documentation (coming soon)

## Documentation

- `CLAUDE.md` - Technical guide for AI agents and developers
- `AI_AGENT_HANDOFF.md` - Session history and pending tasks
- `QUICK_START.md` - Quick start guide for both features
- `SCREENER_GUIDE.md` - Comprehensive screener documentation
- `DATABASE_SETUP.md` - Database setup for local and Vercel
- `LOCALSTORAGE_ANALYSIS.md` - localStorage to database migration details
- `DEBT_OPTIMIZER_MIGRATION_COMPLETE.md` - Debt optimizer migration guide

## Support

For issues or questions:
- GitHub Issues: https://github.com/maruthiram08/klyx-new/issues
- Check documentation in `/docs` folder

## License

[License information to be added]

---

**Made with ❤️ by Klyx Team**
