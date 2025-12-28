# Klyx Platform - Complete Implementation Roadmap

**Document Version:** 1.0  
**Created:** December 28, 2025  
**Purpose:** Single source of truth for AI agent-driven development  
**Status:** Active Development Plan

---

## 🎯 Document Purpose & Usage

This document provides **granular, step-by-step instructions** for implementing all optimization and feature work identified in:
- `FRONTEND_PERFORMANCE_ANALYSIS.md` - Frontend optimization opportunities
- `BACKEND_PERFORMANCE_ANALYSIS.md` - Backend optimization opportunities  
- `backlog.md` - Feature backlog and technical debt
- `FRONTEND_REFACTORING_SCOPE.md` - Refactoring scope

**For AI Agents:**
- Each task includes exact file paths, code snippets, and verification steps
- No assumptions - all context is provided
- Tasks are ordered by dependency and priority
- Success criteria clearly defined

---

## 📊 Project Status Overview

### Current State (Dec 28, 2025)

**Architecture:**
- Frontend: Next.js 16 + React 19 + Tailwind 4 (Port 3000)
- Backend: Flask (Port 5001) + FastAPI (Port 8000)
- Database: SQLite (dev) / Postgres (prod via Vercel)
- Deployment: Vercel (Serverless)

**Critical Metrics:**
```
Frontend FCP:              2.5-3.5s    🔴 Slow
Backend Portfolio API:     5-10s       🔴 Very Slow (N+1 queries)
Stock Search Query:        300-500ms   🟡 Acceptable
Processing Pipeline:       20+ mins    🔴 Times out on Vercel
Cache Hit Rate:            0%          🔴 No caching
```

**Blockers:**
1. ⚠️ Stock database NOT initialized - screener returns 0 results
2. ⚠️ Portfolio N+1 query pattern - very slow load times
3. ⚠️ No caching layer - repeated queries hit DB every time
4. ⚠️ Background job system missing - long operations timeout

---

## 🚀 Implementation Phases

### Phase 1: Critical Infrastructure (Week 1)
**Goal:** Fix blockers, add essential infrastructure  
**Impact:** High | Effort: Low-Medium  
**Dependencies:** None

### Phase 2: Performance Optimization (Week 2)
**Goal:** Add caching, optimize queries, improve frontend  
**Impact:** High | Effort: Medium  
**Dependencies:** Phase 1

### Phase 3: Architecture Refactor (Week 3-4)
**Goal:** Server components, background jobs, consolidation  
**Impact: Very High | Effort: High  
**Dependencies:** Phase 1, 2

### Phase 4: Production Hardening (Week 5)
**Goal:** Security, monitoring, deployment optimization  
**Impact:** Medium | Effort: Medium  
**Dependencies:** Phase 1, 2, 3

### Phase 5: Feature Enhancements (Week 6+)
**Goal:** New features from backlog  
**Impact:** Medium | Effort: Varies  
**Dependencies:** Phase 1, 2, 3, 4

---

# PHASE 1: CRITICAL INFRASTRUCTURE (WEEK 1)

## Task 1.1: Initialize Stock Database ⭐ BLOCKER

**Priority:** P0 - Critical  
**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Blocks:** All screener functionality

### Context
The stock database is empty. The screener API returns 0 results because there's no data to query. This must be completed first.

### Implementation Steps

**Step 1.1.1: Navigate to Backend Directory**
```bash
cd "/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend"
```

**Step 1.1.2: Verify Database Configuration**
```bash
# Check environment variables
echo $POSTGRES_URL
echo $USE_SQLITE

# Expected: POSTGRES_URL is empty (use SQLite for dev)
# Expected: USE_SQLITE is unset or "true"
```

**Step 1.1.3: Initialize Database Schema**
```bash
python3 database/db_config.py

# Expected output:
# ✅ Database initialized successfully
```

**Verification:**
```bash
# Check SQLite database exists
ls -lh database/stocks.db

# Expected: File exists, ~0-100KB (empty schema)
```

**Step 1.1.4: Run Stock Populator**
```bash
python3 database/stock_populator.py

# This will:
# 1. Fetch NSE stock list from external API
# 2. Insert stocks into database
# 3. Show progress bar
# 4. Take 15-30 minutes to complete
```

**Expected Output:**
```
Fetching NSE stock list...
✓ Retrieved 2000+ stocks from NSE

Populating database...
Progress: [████████████████████] 100% (2000/2000)

✓ Inserted: 2000 stocks
✓ Updated: 0 stocks
✓ Skipped: 0 duplicates

Database population complete!
```

**Verification:**
```bash
# Test database has data
python3 << EOF
from database.db_config import db_config
result = db_config.execute_query("SELECT COUNT(*) as count FROM stocks", fetch_one=True)
print(f"Total stocks in database: {result['count']}")
EOF

# Expected output:
# Total stocks in database: 2000+
```

**Step 1.1.5: Test Screener API**
```bash
# Test Flask endpoint
curl http://127.0.0.1:5001/api/database/stats

# Expected JSON response:
{
  "status": "success",
  "data": {
    "total_stocks": 2000,
    "high_quality_stocks": 0,  # Will increase after enrichment
    "avg_quality": 30,
    "top_sectors": [...]
  }
}
```

### Success Criteria
- ✅ `stocks.db` file exists and is >1MB
- ✅ Database contains 2000+ stocks
- ✅ `/api/database/stats` returns valid data
- ✅ Screener presets return >0 matches

### Rollback Plan
```bash
# If something goes wrong, reset database
rm database/stocks.db
python3 database/db_config.py
# Then re-run population
```

---

## Task 1.2: Add Database Indexes

**Priority:** P0 - Critical  
**Estimated Time:** 15 minutes  
**Dependencies:** Task 1.1  
**Impact:** 80% faster queries

### Context
The stock database has no indexes except the primary key. Every query does a full table scan. Adding indexes on frequently queried columns will dramatically improve performance.

### Implementation Steps

**Step 1.2.1: Update Schema File**

**File:** `backend/database/schema.sql`

**Location:** After the `CREATE TABLE stocks` statement (around line 50)

**Add these indexes:**
```sql
-- Performance Indexes for Common Queries
-- Add after CREATE TABLE stocks statement

-- Search indexes (for stock name and NSE code searches)
CREATE INDEX IF NOT EXISTS idx_stocks_name ON stocks(stock_name);
CREATE INDEX IF NOT EXISTS idx_stocks_nse_code ON stocks(nse_code);

-- Filter indexes (for screener queries)
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector_name);
CREATE INDEX IF NOT EXISTS idx_stocks_industry ON stocks(industry_name);
CREATE INDEX IF NOT EXISTS idx_stocks_quality ON stocks(data_quality_score);

-- Sort indexes (for default sorting)
CREATE INDEX IF NOT EXISTS idx_stocks_market_cap ON stocks(market_cap DESC);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_stocks_sector_quality 
  ON stocks(sector_name, data_quality_score);

-- Search optimization (case-insensitive search)
CREATE INDEX IF NOT EXISTS idx_stocks_name_lower 
  ON stocks(LOWER(stock_name));
CREATE INDEX IF NOT EXISTS idx_stocks_code_lower 
  ON stocks(LOWER(nse_code));

-- Valuation indexes (for screener filters)
CREATE INDEX IF NOT EXISTS idx_stocks_pe_ttm ON stocks(pe_ttm);
CREATE INDEX IF NOT EXISTS idx_stocks_roe ON stocks(roe_annual_pct);
CREATE INDEX IF NOT EXISTS idx_stocks_pb_ratio ON stocks(pb_ratio);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_stocks_day_change ON stocks(day_change_pct);
CREATE INDEX IF NOT EXISTS idx_stocks_month_change ON stocks(month_change_pct);

-- Last updated index (for stale data detection)
CREATE INDEX IF NOT EXISTS idx_stocks_last_updated ON stocks(last_updated);
```

**Step 1.2.2: Apply Indexes to Existing Database**

**Create new file:** `backend/database/add_indexes.py`

```python
#!/usr/bin/env python3
"""
Add performance indexes to stocks database.
Run this after initial database population.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_config import db_config

def add_indexes():
    """Add all performance indexes to stocks table"""
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_stocks_name ON stocks(stock_name)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_nse_code ON stocks(nse_code)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector_name)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_industry ON stocks(industry_name)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_quality ON stocks(data_quality_score)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_market_cap ON stocks(market_cap DESC)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_sector_quality ON stocks(sector_name, data_quality_score)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_pe_ttm ON stocks(pe_ttm)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_roe ON stocks(roe_annual_pct)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_pb_ratio ON stocks(pb_ratio)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_day_change ON stocks(day_change_pct)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_month_change ON stocks(month_change_pct)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_last_updated ON stocks(last_updated)",
    ]
    
    print("Adding indexes to stocks table...")
    
    for idx, sql in enumerate(indexes, 1):
        try:
            db_config.execute_query(sql)
            print(f"✓ Created index {idx}/{len(indexes)}")
        except Exception as e:
            print(f"✗ Failed to create index {idx}: {e}")
    
    print("\n✅ All indexes created successfully!")
    
    # Verify indexes exist
    if db_config.is_production:
        # PostgreSQL
        verify_sql = """
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'stocks' 
            ORDER BY indexname
        """
    else:
        # SQLite
        verify_sql = """
            SELECT name 
            FROM sqlite_master 
            WHERE type = 'index' 
            AND tbl_name = 'stocks'
            ORDER BY name
        """
    
    indexes_result = db_config.execute_query(verify_sql)
    print(f"\nTotal indexes on stocks table: {len(indexes_result)}")
    for idx in indexes_result:
        index_name = idx.get('indexname') or idx.get('name')
        print(f"  - {index_name}")

if __name__ == "__main__":
    add_indexes()
```

**Step 1.2.3: Run Index Creation Script**
```bash
cd backend
python3 database/add_indexes.py

# Expected output:
# Adding indexes to stocks table...
# ✓ Created index 1/13
# ✓ Created index 2/13
# ...
# ✅ All indexes created successfully!
# Total indexes on stocks table: 14 (13 + primary key)
```

**Step 1.2.4: Verify Performance Improvement**

**Before (without indexes):**
```bash
# Time a search query
time python3 << EOF
from database.db_config import db_config
result = db_config.execute_query(
    "SELECT * FROM stocks WHERE stock_name LIKE '%RELIANCE%'",
    fetch_one=True
)
print(result)
EOF

# Expected: 300-500ms (table scan)
```

**After (with indexes):**
```bash
# Same query should be much faster
time python3 << EOF
from database.db_config import db_config
result = db_config.execute_query(
    "SELECT * FROM stocks WHERE stock_name LIKE '%RELIANCE%'",
    fetch_one=True
)
print(result)
EOF

# Expected: 10-50ms (index lookup)
```

### Success Criteria
- ✅ All 13 indexes created successfully
- ✅ Search queries run in <50ms (vs 300-500ms before)
- ✅ Screener preset queries complete in <300ms
- ✅ No errors when querying stocks

### Performance Benchmarks
Run these queries to verify speed improvements:

```sql
-- Search by name (should use idx_stocks_name)
EXPLAIN QUERY PLAN 
SELECT * FROM stocks WHERE stock_name = 'Reliance Industries';

-- Filter by sector (should use idx_stocks_sector_quality)
EXPLAIN QUERY PLAN
SELECT * FROM stocks 
WHERE sector_name = 'Banking' 
  AND data_quality_score >= 50;

-- Sort by market cap (should use idx_stocks_market_cap)
EXPLAIN QUERY PLAN
SELECT * FROM stocks 
ORDER BY market_cap DESC 
LIMIT 50;
```

Expected output should show "USING INDEX" not "SCAN TABLE".

---

## Task 1.3: Fix Portfolio N+1 Query Problem

**Priority:** P0 - Critical  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1  
**Impact:** 10-20x faster portfolio loading (5-10s → <500ms)

### Context
Currently, the frontend makes N+1 API calls to load a portfolio:
1. GET `/api/portfolio` → Returns ["RELIANCE", "TCS", "INFY"]
2. For each stock: GET `/api/database/stocks?search=RELIANCE&limit=1`

This is extremely slow. We need a batch endpoint.

### Implementation Steps

**Step 1.3.1: Create Batch Endpoint in Backend**

**File:** `backend/api/database_routes.py`

**Location:** Add after the `get_stock_details` function (around line 120)

**Add this new route:**
```python
@db_routes.route("/stocks/batch", methods=["POST"])
def get_stocks_batch():
    """
    Get multiple stocks in a single query.
    
    Request body:
    {
        "stock_names": ["Reliance Industries", "TCS", "Infosys"]
    }
    
    Response:
    {
        "status": "success",
        "data": [
            { stock data for Reliance... },
            { stock data for TCS... },
            { stock data for Infosys... }
        ],
        "metadata": {
            "requested": 3,
            "found": 3,
            "missing": []
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'stock_names' not in data:
            return jsonify({
                "status": "error",
                "message": "stock_names array is required in request body"
            }), 400
        
        stock_names = data['stock_names']
        
        if not isinstance(stock_names, list):
            return jsonify({
                "status": "error",
                "message": "stock_names must be an array"
            }), 400
        
        if len(stock_names) == 0:
            return jsonify({
                "status": "success",
                "data": [],
                "metadata": {"requested": 0, "found": 0, "missing": []}
            })
        
        # Build SQL query with IN clause
        placeholders = ','.join(['?' for _ in stock_names])
        query = f"""
            SELECT *
            FROM stocks
            WHERE stock_name IN ({placeholders})
        """
        
        stocks = db_config.execute_query(query, tuple(stock_names))
        
        # Track which stocks were found
        found_names = {stock['stock_name'] for stock in stocks}
        missing_names = [name for name in stock_names if name not in found_names]
        
        return jsonify({
            "status": "success",
            "data": stocks,
            "metadata": {
                "requested": len(stock_names),
                "found": len(stocks),
                "missing": missing_names
            }
        })
    
    except Exception as e:
        logger.error(f"Batch stocks error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
```

**Step 1.3.2: Update Frontend API Client**

**File:** `frontend/api.ts`

**Location:** Add after the `getStocks` function (around line 95)

**Add this new function:**
```typescript
getStocksBatch: async (stockNames: string[]) => {
  const res = await fetch(`${API_BASE}/database/stocks/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stock_names: stockNames })
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch stocks batch: ${res.status}`);
  }
  
  const data = await res.json();
  
  if (data.status === 'success') {
    // Map to frontend format
    data.data = data.data.map(mapDatabaseToFrontend);
  }
  
  return data;
},
```

**Step 1.3.3: Update Portfolio Page to Use Batch Endpoint**

**File:** `frontend/app/portfolio/page.tsx`

**Location:** Replace the `loadData` function (around line 30-70)

**Replace with:**
```typescript
const loadData = async () => {
  console.log("=== Portfolio loadData START ===");
  console.log("User:", user);
  console.log("Auth Loading:", authLoading);

  if (!user) {
    console.log("No user, clearing stocks");
    setStocks([]);
    return;
  }

  setIsLoading(true);
  try {
    // Step 1: Fetch portfolio stock names
    console.log("Fetching portfolio...");
    const portfolioRes = await api.getPortfolio();

    console.log("Portfolio API Response:", JSON.stringify(portfolioRes, null, 2));

    if (portfolioRes.status !== "success") {
      console.log("Portfolio status not success:", portfolioRes.status);
      setStocks([]);
      setIsLoading(false);
      return;
    }

    if (!portfolioRes.data?.stock_names) {
      console.log("No stock_names in response data:", portfolioRes.data);
      setStocks([]);
      setIsLoading(false);
      return;
    }

    const stockNames: string[] = portfolioRes.data.stock_names;
    console.log("Stock names in portfolio:", stockNames);

    if (stockNames.length === 0) {
      console.log("Stock names array is empty");
      setStocks([]);
      setIsLoading(false);
      return;
    }

    // Step 2: Fetch all stock details in ONE batch request
    console.log(`Fetching ${stockNames.length} stocks in batch...`);
    const batchRes = await api.getStocksBatch(stockNames);
    
    if (batchRes.status === "success") {
      console.log(`Found ${batchRes.data.length} stocks`);
      
      if (batchRes.metadata.missing.length > 0) {
        console.warn("Missing stocks from database:", batchRes.metadata.missing);
        // Optionally show a warning to user
      }
      
      setStocks(batchRes.data);
    } else {
      console.error("Batch fetch failed:", batchRes.message);
      setStocks([]);
    }
  } catch (e) {
    console.error("Failed to load portfolio:", e);
    setStocks([]);
  } finally {
    setIsLoading(false);
    console.log("=== Portfolio loadData END ===");
  }
};
```

**Step 1.3.4: Test the Changes**

**Terminal 1 - Backend:**
```bash
cd backend
python3 app.py

# Should see:
# ✓ All blueprints registered
# * Running on http://127.0.0.1:5001
```

**Terminal 2 - Test Batch Endpoint:**
```bash
# Test with curl
curl -X POST http://127.0.0.1:5001/api/database/stocks/batch \
  -H "Content-Type: application/json" \
  -d '{"stock_names": ["Reliance Industries", "TCS", "Infosys"]}'

# Expected response:
{
  "status": "success",
  "data": [
    { /* Reliance data */ },
    { /* TCS data */ },
    { /* Infosys data */ }
  ],
  "metadata": {
    "requested": 3,
    "found": 3,
    "missing": []
  }
}
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev

# Navigate to http://localhost:3000/portfolio
# Open browser DevTools → Network tab
# Should see:
# 1. GET /api/portfolio (returns stock names)
# 2. POST /api/database/stocks/batch (returns all stocks)
# Total: 2 requests instead of N+1
```

**Step 1.3.5: Performance Verification**

**Before (N+1 pattern):**
```
Portfolio with 10 stocks:
- 1 request to /api/portfolio (~100ms)
- 10 requests to /api/database/stocks?search=... (~200ms each)
Total: ~2.1 seconds
```

**After (batch pattern):**
```
Portfolio with 10 stocks:
- 1 request to /api/portfolio (~100ms)
- 1 request to /api/database/stocks/batch (~150ms)
Total: ~250ms

Improvement: 8-10x faster! 🚀
```

### Success Criteria
- ✅ Batch endpoint returns data for multiple stocks
- ✅ Portfolio page makes only 2 API calls (not N+1)
- ✅ Portfolio loads in <500ms (measured in Network tab)
- ✅ Missing stocks are logged but don't crash the page
- ✅ No console errors in browser

### Rollback Plan
If the batch endpoint has issues:
1. Comment out the new batch code in `portfolio/page.tsx`
2. Revert to the old sequential fetching code
3. File a bug with error details
4. The old code will still work (just slower)

---

## Task 1.4: Add HTTP Cache Headers

**Priority:** P1 - High  
**Estimated Time:** 1 hour  
**Dependencies:** None  
**Impact:** 90% reduction in repeated static requests

### Context
Static endpoints (like screener presets, sectors list) are re-fetched on every request. Adding HTTP cache headers lets the browser cache these responses.

### Implementation Steps

**Step 1.4.1: Create Cache Helper Function**

**File:** `backend/app.py`

**Location:** Add after imports, before route definitions (around line 30)

**Add this helper:**
```python
from functools import wraps
from flask import make_response
import hashlib
import json

def cache_response(max_age=3600, etag=True):
    """
    Decorator to add HTTP cache headers to Flask responses.
    
    Args:
        max_age: Cache duration in seconds (default: 1 hour)
        etag: Whether to generate ETag for cache validation (default: True)
    
    Usage:
        @app.route("/api/something")
        @cache_response(max_age=1800)  # Cache for 30 minutes
        def something():
            return jsonify(data)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Call the original function
            result = f(*args, **kwargs)
            
            # Convert to response object if needed
            if not isinstance(result, tuple):
                response = make_response(result)
            else:
                response = make_response(*result)
            
            # Add cache headers
            response.headers['Cache-Control'] = f'public, max-age={max_age}'
            
            # Generate ETag if requested
            if etag and response.status_code == 200:
                # Generate ETag from response body
                content = response.get_data()
                etag_value = hashlib.md5(content).hexdigest()
                response.headers['ETag'] = f'"{etag_value}"'
                
                # Check if client has cached version
                if request.headers.get('If-None-Match') == f'"{etag_value}"':
                    # Client has fresh copy, send 304 Not Modified
                    return '', 304
            
            return response
        
        return decorated_function
    return decorator
```

**Step 1.4.2: Apply Cache Headers to Static Endpoints**

**File:** `backend/app.py`

**Location:** Find the screener presets endpoint (around line 250)

**Modify:**
```python
@app.route("/api/screener/presets", methods=["GET"])
@cache_response(max_age=3600)  # ← Add this line (cache for 1 hour)
def get_screener_presets():
    """Get all available screening presets"""
    # ... existing code ...
```

**File:** `backend/api/database_routes.py`

**Location:** Find the sectors endpoint (around line 180)

**Add cache decorator:**
```python
from app import cache_response  # Add this import at top

@db_routes.route("/sectors", methods=["GET"])
@cache_response(max_age=1800)  # ← Add this line (cache for 30 minutes)
def get_sectors():
    """Get list of all sectors with stock counts"""
    # ... existing code ...
```

**Step 1.4.3: Add Variable Cache for Database Stats**

**File:** `backend/api/database_routes.py`

**Location:** Find the stats endpoint (around line 90)

**Modify:**
```python
@db_routes.route("/stats", methods=["GET"])
@cache_response(max_age=300)  # ← Add this line (cache for 5 minutes)
def get_database_stats():
    """Get database statistics"""
    # ... existing code ...
```

**Step 1.4.4: Configure Frontend to Respect Cache**

**File:** `frontend/next.config.ts`

**Location:** Add after the rewrites section

**Add:**
```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    // ... existing rewrites ...
  },
  
  async headers() {
    return [
      {
        // Match API routes that should be cached
        source: '/api/(screener/presets|database/sectors|database/stats)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
};
```

**Step 1.4.5: Test Caching Behavior**

**Test 1: ETag Validation**
```bash
# First request - full response
curl -i http://127.0.0.1:5001/api/screener/presets

# Look for headers:
# Cache-Control: public, max-age=3600
# ETag: "abc123..."

# Second request with ETag - should get 304
ETAG=$(curl -s -i http://127.0.0.1:5001/api/screener/presets | grep ETag | cut -d' ' -f2)
curl -i -H "If-None-Match: $ETAG" http://127.0.0.1:5001/api/screener/presets

# Expected: HTTP/1.1 304 Not Modified
# Body should be empty (not re-sent)
```

**Test 2: Browser Cache**
1. Open browser DevTools → Network tab
2. Navigate to http://localhost:3000/screener
3. First load: See full request to `/api/screener/presets`
4. Reload page (Cmd+R / Ctrl+R)
5. Second load: Should see "(from cache)" or "304 Not Modified"
6. No new data downloaded!

**Test 3: Cache Expiry**
```bash
# Request 1: Fresh data
curl -i http://127.0.0.1:5001/api/database/stats

# Wait 6 minutes (cache expires at 5 min)

# Request 2: Should get fresh data again
curl -i http://127.0.0.1:5001/api/database/stats

# Verify Cache-Control header shows max-age=300
```

### Success Criteria
- ✅ Cache headers present on static endpoints
- ✅ Browser shows "(from cache)" on repeated requests
- ✅ 304 responses for unchanged data
- ✅ Fresh data after cache expiry
- ✅ No increase in errors

### Cache Strategy Summary

| Endpoint | Cache Duration | Reason |
|----------|----------------|--------|
| `/api/screener/presets` | 1 hour | Static configuration |
| `/api/database/sectors` | 30 minutes | Rarely changes |
| `/api/database/stats` | 5 minutes | Updates with new stocks |
| `/api/database/stocks` | No cache | User-specific queries |
| `/api/portfolio` | No cache | User-specific data |

---

## Task 1.5: Fix Hardcoded Absolute Paths

**Priority:** P1 - High  
**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Impact:** Enables deployment on other machines/servers

### Context
Multiple Python files have hardcoded absolute paths like `/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend`. This breaks when:
- Deploying to Vercel/Railway
- Another developer clones the repo
- Moving the project directory

### Implementation Steps

**Step 1.5.1: Audit Hardcoded Paths**

**File:** `backend/app.py`

**Find** (around line 14):
```python
sys.path.append("/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend")
```

**Replace with:**
```python
# Add backend directory to path (relative to this file)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BACKEND_DIR)
```

**Step 1.5.2: Fix Database Path References**

**File:** `backend/database/db_config.py`

**Verify** (around line 20):
```python
# This is CORRECT (already relative):
self.sqlite_path = os.path.join(os.path.dirname(__file__), "stocks.db")
```

**No change needed** - already using relative path.

**Step 1.5.3: Fix Upload Folder Path**

**File:** `backend/app.py`

**Find** (around line 60):
```python
app.config["UPLOAD_FOLDER"] = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "datasource"
)
```

**Verify** this is CORRECT (already relative).

**Step 1.5.4: Check Data Processing Scripts**

**File:** `backend/clean_data.py`

**Find hardcoded paths and replace:**

**Before:**
```python
datasource_dir = "/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/datasource"
```

**After:**
```python
# Get datasource directory relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
datasource_dir = os.path.join(SCRIPT_DIR, "datasource")
```

**File:** `backend/enrich_data.py`

**Apply same fix:**
```python
# Get paths relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(SCRIPT_DIR, "nifty50_unified_master.xlsx")
output_file = os.path.join(SCRIPT_DIR, "nifty50_enriched.xlsx")
```

**File:** `backend/generate_insights.py`

**Apply same fix:**
```python
# Get paths relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(SCRIPT_DIR, "nifty50_enriched.xlsx")
output_file = os.path.join(SCRIPT_DIR, "nifty50_final_analysis.xlsx")
```

**Step 1.5.5: Search for Remaining Hardcoded Paths**

```bash
cd backend

# Search for hardcoded path patterns
grep -r "/Users/maruthi" . --include="*.py"

# Should return 0 results (or only in comments)
```

**Step 1.5.6: Verify Everything Still Works**

**Test 1: Backend starts correctly**
```bash
cd backend
python3 app.py

# Expected:
# ✓ Using SQLite database: /path/to/backend/database/stocks.db
# ✓ All blueprints registered
# * Running on http://127.0.0.1:5001
```

**Test 2: File processing works**
```bash
cd backend
python3 clean_data.py

# Should find files in datasource/ directory
# No "File not found" errors
```

**Test 3: Database operations work**
```bash
cd backend
python3 << EOF
from database.db_config import db_config
print(f"Database path: {db_config.sqlite_path}")
result = db_config.execute_query("SELECT COUNT(*) as count FROM stocks", fetch_one=True)
print(f"Stock count: {result['count']}")
EOF

# Expected:
# Database path: /actual/path/backend/database/stocks.db
# Stock count: 2000+
```

### Success Criteria
- ✅ No hardcoded `/Users/maruthi/...` paths in any `.py` files
- ✅ Backend starts without errors
- ✅ File processing scripts work
- ✅ Database queries work
- ✅ Works when project is moved to different directory

### Verification on Different Machine
```bash
# Simulate deployment to different path
mv "/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool" /tmp/klyx
cd /tmp/klyx/backend
python3 app.py

# Should work without modification
```

---

# PHASE 2: PERFORMANCE OPTIMIZATION (WEEK 2)

## Task 2.1: Install and Configure Flask-Caching

**Priority:** P1 - High  
**Estimated Time:** 1 hour  
**Dependencies:** Phase 1 complete  
**Impact:** 5-10x faster repeated queries

### Context
Currently every API request hits the database, even for data that rarely changes. Adding an in-memory cache will dramatically speed up repeated requests.

### Implementation Steps

**Step 2.1.1: Install Flask-Caching**

**File:** `backend/requirements.txt`

**Add at the end:**
```txt
Flask-Caching==2.1.0
```

**Install:**
```bash
cd backend
pip3 install Flask-Caching==2.1.0

# Verify installation
python3 -c "from flask_caching import Cache; print('✓ Flask-Caching installed')"
```

**Step 2.1.2: Initialize Cache in Flask App**

**File:** `backend/app.py`

**Location:** After Flask app creation (around line 25)

**Add:**
```python
from flask_caching import Cache

# Configure cache
# Development: Simple in-memory cache
# Production: Redis cache (configure via REDIS_URL env var)
cache_config = {
    'CACHE_TYPE': 'simple',  # In-memory cache for single process
    'CACHE_DEFAULT_TIMEOUT': 300  # 5 minutes default
}

# Override with Redis for production if REDIS_URL is set
redis_url = os.environ.get('REDIS_URL')
if redis_url:
    cache_config = {
        'CACHE_TYPE': 'redis',
        'CACHE_REDIS_URL': redis_url,
        'CACHE_DEFAULT_TIMEOUT': 300
    }
    print(f"✓ Using Redis cache: {redis_url}")
else:
    print("✓ Using in-memory cache (development mode)")

cache = Cache(app, config=cache_config)
```

**Step 2.1.3: Export Cache for Use in Blueprints**

**File:** `backend/app.py`

**Location:** After cache initialization

**Add:**
```python
# Export cache for use in blueprints
app.cache = cache
```

**Step 2.1.4: Apply Caching to Database Routes**

**File:** `backend/api/database_routes.py`

**Location:** After blueprint creation (around line 15)

**Add:**
```python
# Get cache from app
from flask import current_app

def get_cache():
    """Get cache from current app context"""
    return current_app.cache
```

**Step 2.1.5: Cache Stock List Endpoint**

**File:** `backend/api/database_routes.py`

**Location:** Find `list_stocks` function (around line 90)

**Wrap with cache:**
```python
@db_routes.route("/stocks", methods=["GET"])
def list_stocks():
    """
    List stocks with pagination.
    Cached for 5 minutes, cache key includes query params.
    """
    try:
        # Build cache key from query parameters
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        sector = request.args.get("sector")
        min_quality = int(request.args.get("min_quality", 30))
        search = request.args.get("search")
        
        # Create unique cache key
        cache_key = f"stocks_list:{limit}:{offset}:{sector}:{min_quality}:{search}"
        
        # Try cache first
        cache = get_cache()
        cached_result = cache.get(cache_key)
        
        if cached_result:
            print(f"✓ Cache HIT: {cache_key}")
            return jsonify(cached_result)
        
        print(f"✗ Cache MISS: {cache_key}")
        
        # ... existing query code ...
        
        result = {
            "status": "success",
            "data": stocks,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": total,
                "has_more": (offset + limit) < total,
            }
        }
        
        # Store in cache (5 minutes)
        cache.set(cache_key, result, timeout=300)
        
        return jsonify(result)
    
    except Exception as e:
        # ... existing error handling ...
```

**Step 2.1.6: Cache Screener Presets**

**File:** `backend/app.py`

**Location:** Find `get_screener_presets` (around line 250)

**Add decorator:**
```python
@app.route("/api/screener/presets", methods=["GET"])
@cache.cached(timeout=3600)  # Cache for 1 hour
def get_screener_presets():
    """Get all available screening presets"""
    # ... existing code ...
```

**Step 2.1.7: Cache Screener Results**

**File:** `backend/app.py`

**Location:** Find `apply_screener_preset` (around line 270)

**Add caching:**
```python
@app.route("/api/screener/preset/<preset_name>", methods=["GET"])
def apply_screener_preset(preset_name):
    """Apply a preset screening strategy (with caching)"""
    
    # Build cache key
    cache_key = f"screener_preset:{preset_name}"
    
    # Try cache first
    cached_result = cache.get(cache_key)
    if cached_result:
        print(f"✓ Cache HIT: Screener preset '{preset_name}'")
        return jsonify(cached_result)
    
    print(f"✗ Cache MISS: Screener preset '{preset_name}'")
    
    try:
        # ... existing screener logic ...
        
        result = {
            "status": "success",
            "results": records,
            "metadata": result["metadata"],
            "source": "database",
        }
        
        # Cache for 15 minutes (stock data changes)
        cache.set(cache_key, result, timeout=900)
        
        return jsonify(result)
    
    except Exception as e:
        # ... existing error handling ...
```

**Step 2.1.8: Add Cache Invalidation on Data Updates**

**File:** `backend/api/database_routes.py`

**Location:** Find `refresh_database` (around line 160)

**Add cache clearing:**
```python
@db_routes.route("/refresh", methods=["POST"])
def refresh_database():
    """Full database refresh - also clears cache"""
    try:
        # ... existing refresh logic ...
        
        # Clear all caches since data has changed
        cache = get_cache()
        cache.clear()
        print("✓ Cache cleared after database refresh")
        
        return jsonify({
            "status": "success",
            "message": "Database refreshed and cache cleared",
            "data": results,
        })
    
    except Exception as e:
        # ... existing error handling ...
```

**Step 2.1.9: Add Cache Status Endpoint**

**File:** `backend/api/database_routes.py`

**Location:** Add new endpoint at end of file

**Add:**
```python
@db_routes.route("/cache/stats", methods=["GET"])
def get_cache_stats():
    """Get cache statistics"""
    cache = get_cache()
    
    # Note: Simple cache doesn't have detailed stats
    # This is mainly useful for Redis cache
    return jsonify({
        "status": "success",
        "data": {
            "type": "simple" if not os.environ.get('REDIS_URL') else "redis",
            "message": "Cache is active"
        }
    })

@db_routes.route("/cache/clear", methods=["POST"])
def clear_cache():
    """Clear all cache (admin endpoint)"""
    try:
        cache = get_cache()
        cache.clear()
        
        return jsonify({
            "status": "success",
            "message": "Cache cleared successfully"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
```

**Step 2.1.10: Test Caching Behavior**

**Test 1: Verify cache is working**
```bash
# Start backend
cd backend
python3 app.py

# In another terminal, make request twice
curl http://127.0.0.1:5001/api/database/stocks?limit=10

# First request - should see in backend logs:
# ✗ Cache MISS: stocks_list:10:0:None:30:None

curl http://127.0.0.1:5001/api/database/stocks?limit=10

# Second request - should see:
# ✓ Cache HIT: stocks_list:10:0:None:30:None
```

**Test 2: Measure performance improvement**
```bash
# Without cache (first request)
time curl http://127.0.0.1:5001/api/database/stocks?limit=50

# Expected: 200-500ms

# With cache (second request)
time curl http://127.0.0.1:5001/api/database/stocks?limit=50

# Expected: 10-50ms (5-10x faster!)
```

**Test 3: Verify cache invalidation**
```bash
# Request 1: Populate cache
curl http://127.0.0.1:5001/api/database/stocks?limit=10

# Clear cache
curl -X POST http://127.0.0.1:5001/api/database/cache/clear

# Request 2: Should be cache miss again
curl http://127.0.0.1:5001/api/database/stocks?limit=10

# Should see "Cache MISS" in backend logs
```

### Success Criteria
- ✅ Flask-Caching installed and configured
- ✅ Cache HITs shown in logs for repeated requests
- ✅ Response time 5-10x faster on cached requests
- ✅ Cache invalidates on data refresh
- ✅ Different query params create different cache keys
- ✅ No errors or memory leaks

### Cache Strategy Summary

| Endpoint | Timeout | Invalidation |
|----------|---------|--------------|
| `/api/screener/presets` | 1 hour | Manual only |
| `/api/database/stocks` | 5 minutes | On refresh |
| `/api/screener/preset/*` | 15 minutes | On refresh |
| `/api/database/sectors` | 30 minutes | On refresh |
| `/api/database/stats` | 5 minutes | On refresh |

---

## Task 2.2: Install and Configure React Query

**Priority:** P1 - High  
**Estimated Time:** 2 hours  
**Dependencies:** None  
**Impact:** 80-90% faster navigation, instant back/forward

### Context
The frontend currently fetches data on every page load with `useEffect` + `fetch`. React Query provides:
- Automatic caching
- Background refetching
- Optimistic updates
- Prefetching
- De-duplication

### Implementation Steps

**Step 2.2.1: Install TanStack Query**

**File:** `frontend/package.json`

**Terminal:**
```bash
cd frontend
npm install @tanstack/react-query@5.17.0 @tanstack/react-query-devtools@5.17.0

# Verify installation
npm list @tanstack/react-query
```

**Step 2.2.2: Create QueryClient Provider**

**File:** `frontend/app/providers.tsx` (NEW FILE)

**Create with:**
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient with configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long data is considered fresh
            staleTime: 5 * 60 * 1000, // 5 minutes
            
            // Cache time: How long unused data stays in cache
            gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime in v4)
            
            // Retry failed requests
            retry: 1,
            
            // Refetch on window focus (turn off for development)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools - only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 2.2.3: Wrap App with QueryClient**

**File:** `frontend/app/layout.tsx`

**Modify:**
```typescript
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from "./providers";  // ← Add this import
import ChatAssistant from "@/components/ChatAssistant";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased text-neutral-900 bg-white selection:bg-[#ccf32f] selection:text-black">
        <Providers>  {/* ← Add this wrapper */}
          <AuthProvider>
            {children}
            <ChatAssistant />
          </AuthProvider>
        </Providers>  {/* ← Close wrapper */}
      </body>
    </html>
  );
}
```

**Step 2.2.4: Create Custom Hooks Directory**

**Create directory:**
```bash
cd frontend
mkdir -p hooks
```

**Step 2.2.5: Create useStocks Hook**

**File:** `frontend/hooks/useStocks.ts` (NEW FILE)

**Create with:**
```typescript
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/api';

interface UseStocksParams {
  limit?: number;
  offset?: number;
  sector?: string;
  minQuality?: number;
  search?: string;
}

interface StocksResponse {
  status: string;
  data: any[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

/**
 * Hook to fetch stocks with automatic caching and prefetching
 */
export function useStocks(
  params: UseStocksParams = {},
  options?: Omit<UseQueryOptions<StocksResponse>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient();
  const { limit = 50, offset = 0, sector, minQuality, search } = params;

  // Create unique query key based on params
  const queryKey = ['stocks', { limit, offset, sector, minQuality, search }];

  const query = useQuery<StocksResponse>({
    queryKey,
    queryFn: () => api.getStocks({ limit, offset, sector, min_quality: minQuality, search }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });

  /**
   * Prefetch next page for instant pagination
   */
  const prefetchNextPage = () => {
    if (query.data?.pagination.has_more) {
      queryClient.prefetchQuery({
        queryKey: ['stocks', { limit, offset: offset + limit, sector, minQuality, search }],
        queryFn: () =>
          api.getStocks({
            limit,
            offset: offset + limit,
            sector,
            min_quality: minQuality,
            search,
          }),
      });
    }
  };

  /**
   * Prefetch previous page
   */
  const prefetchPrevPage = () => {
    if (offset > 0) {
      queryClient.prefetchQuery({
        queryKey: [
          'stocks',
          {
            limit,
            offset: Math.max(0, offset - limit),
            sector,
            minQuality,
            search,
          },
        ],
        queryFn: () =>
          api.getStocks({
            limit,
            offset: Math.max(0, offset - limit),
            sector,
            min_quality: minQuality,
            search,
          }),
      });
    }
  };

  return {
    ...query,
    prefetchNextPage,
    prefetchPrevPage,
  };
}
```

**Step 2.2.6: Create usePortfolio Hook**

**File:** `frontend/hooks/usePortfolio.ts` (NEW FILE)

**Create with:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';

/**
 * Hook to manage user's portfolio
 */
export function usePortfolio() {
  const queryClient = useQueryClient();

  // Fetch portfolio
  const portfolioQuery = useQuery({
    queryKey: ['portfolio'],
    queryFn: api.getPortfolio,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Add to portfolio mutation
  const addMutation = useMutation({
    mutationFn: (stockName: string) => api.addToPortfolio(stockName),
    onMutate: async (stockName) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['portfolio'] });

      // Snapshot current state
      const previous = queryClient.getQueryData(['portfolio']);

      // Optimistically update UI
      queryClient.setQueryData(['portfolio'], (old: any) => {
        if (!old?.data?.stock_names) return old;
        return {
          ...old,
          data: {
            ...old.data,
            stock_names: [...old.data.stock_names, stockName],
            count: old.data.stock_names.length + 1,
          },
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['portfolio'], context.previous);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  // Remove from portfolio mutation
  const removeMutation = useMutation({
    mutationFn: (stockName: string) => api.removeFromPortfolio(stockName),
    onMutate: async (stockName) => {
      await queryClient.cancelQueries({ queryKey: ['portfolio'] });

      const previous = queryClient.getQueryData(['portfolio']);

      queryClient.setQueryData(['portfolio'], (old: any) => {
        if (!old?.data?.stock_names) return old;
        return {
          ...old,
          data: {
            ...old.data,
            stock_names: old.data.stock_names.filter((name: string) => name !== stockName),
            count: old.data.stock_names.length - 1,
          },
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['portfolio'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  return {
    portfolio: portfolioQuery.data?.data?.stock_names || [],
    isLoading: portfolioQuery.isLoading,
    error: portfolioQuery.error,
    addToPortfolio: addMutation.mutate,
    removeFromPortfolio: removeMutation.mutate,
    isAddingStock: addMutation.isPending,
    isRemovingStock: removeMutation.isPending,
  };
}
```

**Step 2.2.7: Convert Stocks Page to Use React Query**

**File:** `frontend/app/stocks/page.tsx`

**Replace the entire component with:**
```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStocks } from '@/hooks/useStocks';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Stock } from '../../types';
import Header from '../../components/Header';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Container } from '../../components/ui/Container';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Eye, Plus, Check, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function StockListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Use React Query hooks
  const { data, isLoading, prefetchNextPage, prefetchPrevPage } = useStocks({
    limit,
    offset,
    minQuality: 0,
  });

  const {
    portfolio,
    addToPortfolio,
    removeFromPortfolio,
    isAddingStock,
    isRemovingStock,
  } = usePortfolio();

  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const stocks = data?.data || [];
  const pagination = data?.pagination || {
    limit,
    offset,
    total: 0,
    has_more: false,
  };

  const togglePortfolio = async (e: React.MouseEvent, stockName: string) => {
    e.stopPropagation();
    
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      if (portfolio.includes(stockName)) {
        removeFromPortfolio(stockName);
      } else {
        addToPortfolio(stockName);
      }
    } catch (error: any) {
      setErrorModal({ isOpen: true, message: error.message });
    }
  };

  const handleNextPage = () => {
    if (pagination.has_more) {
      setOffset(offset + limit);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
      window.scrollTo(0, 0);
    }
  };

  // Prefetch on hover
  const handleNextHover = () => {
    if (pagination.has_more) {
      prefetchNextPage();
    }
  };

  const handlePrevHover = () => {
    if (offset > 0) {
      prefetchPrevPage();
    }
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return '-';
    return Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return '-';
    const num = Number(val);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      <ConfirmationModal
        isOpen={errorModal.isOpen}
        title="Error"
        message={errorModal.message}
        confirmLabel="OK"
        onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
        onCancel={() => setErrorModal({ ...errorModal, isOpen: false })}
      />

      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Container>
          <div className="flex justify-between items-end mb-8">
            <div>
              <Typography variant="h1" className="text-3xl font-bold mb-2">
                Market Stocks
              </Typography>
              <Typography variant="body" className="text-neutral-500">
                Browse all available stocks in the database.
              </Typography>
            </div>
            <div className="text-sm text-neutral-500 font-medium">
              Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-neutral-100">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-[#ccf32f] mb-4"></div>
              <Typography variant="body" className="text-neutral-500">
                Loading stocks...
              </Typography>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* ... existing table header ... */}
                  <tbody className="divide-y divide-neutral-100">
                    {stocks.map((stock: Stock) => {
                      const stockName = stock['Stock Name'];
                      const isInPortfolio = portfolio.includes(stockName);
                      const isProcessing = isAddingStock || isRemovingStock;

                      return (
                        <tr
                          key={stock['NSE Code']}
                          className="hover:bg-neutral-50/50 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/stock/${stock['NSE Code']}`)}
                        >
                          {/* ... existing table cells ... */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={isProcessing}
                                onClick={(e) => togglePortfolio(e, stockName)}
                                className={`
                                  flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
                                  ${
                                    isInPortfolio
                                      ? 'bg-emerald-100 text-emerald-600 hover:bg-rose-100 hover:text-rose-600'
                                      : 'bg-neutral-100 text-neutral-400 hover:bg-[#ccf32f] hover:text-black hover:scale-110'
                                  }
                                  ${isProcessing ? 'cursor-wait opacity-70' : ''}
                                `}
                                title={isInPortfolio ? 'Remove from Portfolio' : 'Add to Portfolio'}
                              >
                                {isProcessing ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : isInPortfolio ? (
                                  <Check size={14} />
                                ) : (
                                  <Plus size={16} />
                                )}
                              </button>

                              <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                                <Eye size={16} className="text-neutral-400 group-hover:text-black" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination with prefetching */}
              <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/30">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  onMouseEnter={handlePrevHover}
                  disabled={pagination.offset === 0 || isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  onMouseEnter={handleNextHover}
                  disabled={!pagination.has_more || isLoading}
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}
```

**Step 2.2.8: Test React Query Implementation**

**Test 1: Verify DevTools appear**
```bash
cd frontend
npm run dev

# Open http://localhost:3000/stocks
# Look for React Query DevTools in bottom-right corner
# Should see floating React Query logo
```

**Test 2: Test caching behavior**
1. Navigate to `/stocks`
2. Wait for stocks to load
3. Click "Next" page
4. Click "Previous" to go back
5. **Expected:** Instant load (from cache, no spinner)
6. Open DevTools → See cache entries for both pages

**Test 3: Test prefetching**
1. Navigate to `/stocks`
2. Hover over "Next" button (don't click)
3. Open React Query DevTools
4. **Expected:** See "stocks" query with next page params marked as "fetching"
5. Click "Next"
6. **Expected:** Instant load (already prefetched)

**Test 4: Test optimistic updates**
1. Navigate to `/stocks`
2. Click "Add to Portfolio" on a stock
3. **Expected:** Checkmark appears INSTANTLY (no spinner)
4. Background sync happens automatically
5. If there's an error, it rolls back

### Success Criteria
- ✅ React Query installed and configured
- ✅ DevTools visible in development
- ✅ Stock list caches on navigation
- ✅ Prefetching works on hover
- ✅ Optimistic updates feel instant
- ✅ No console errors

### Performance Comparison

**Before React Query:**
```
Navigate to page → Load (500ms)
Click Next → Load (500ms)
Click Previous → Load (500ms)
Total: 1.5 seconds for 3 navigations
```

**After React Query:**
```
Navigate to page → Load (500ms)
Click Next → Load (500ms first time, then instant)
Click Previous → Instant (from cache)
Hover Next → Prefetch in background
Click Next → Instant (already loaded)
Total: 500ms for first load, instant thereafter
```

---

## Task 2.3: Add Connection Pooling to PostgreSQL

**Priority:** P1 - High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1.1 (Database initialized)  
**Impact:** 50% faster DB operations, better scalability

### Context
Currently, every database query opens a new connection to PostgreSQL. This adds 50-100ms overhead per request. Connection pooling reuses existing connections, dramatically improving performance.

### Implementation Steps

**Step 2.3.1: Install psycopg2-pool**

**File:** `backend/requirements.txt`

**Verify psycopg2-binary is already installed:**
```bash
cd backend
pip3 list | grep psycopg2

# Expected:
# psycopg2-binary    2.9.x
```

**Note:** Connection pooling is included in psycopg2-binary, no new package needed.

**Step 2.3.2: Update Database Config for Connection Pooling**

**File:** `backend/database/db_config.py`

**Location:** Modify the `DatabaseConfig` class `__init__` method (around line 15)

**Replace the entire class with:**
```python
"""
Database configuration for Vercel Postgres.

For local development: Uses SQLite
For production (Vercel): Uses Vercel Postgres (Neon) with connection pooling
"""

import os
import sqlite3
from contextlib import contextmanager
from typing import Optional

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor


class DatabaseConfig:
    """Database configuration manager with connection pooling"""

    def __init__(self):
        # Vercel Postgres connection string
        self.postgres_url = os.getenv("POSTGRES_URL")
        
        # Use PostgreSQL if POSTGRES_URL is set and USE_SQLITE is not explicitly true
        use_sqlite = os.getenv("USE_SQLITE", "false").lower() == "true"
        self.is_production = bool(self.postgres_url) and not use_sqlite

        # Local SQLite for development
        self.sqlite_path = os.path.join(os.path.dirname(__file__), "stocks.db")
        
        # Connection pool for PostgreSQL (production)
        self.connection_pool = None
        
        if self.is_production and self.postgres_url:
            try:
                # Create threaded connection pool
                # minconn: minimum connections to keep open
                # maxconn: maximum connections allowed
                self.connection_pool = pool.ThreadedConnectionPool(
                    minconn=2,
                    maxconn=20,
                    dsn=self.postgres_url
                )
                print(f"✓ PostgreSQL connection pool initialized (2-20 connections)")
            except Exception as e:
                print(f"✗ Failed to create connection pool: {e}")
                self.connection_pool = None

    @contextmanager
    def get_connection(self):
        """Get database connection (pooled for Postgres, direct for SQLite)"""
        if self.is_production and self.connection_pool:
            # Production: Get connection from pool
            conn = None
            try:
                conn = self.connection_pool.getconn()
                conn.cursor_factory = RealDictCursor
                yield conn
                conn.commit()
            except Exception as e:
                if conn:
                    conn.rollback()
                raise e
            finally:
                if conn:
                    # Return connection to pool (don't close it)
                    self.connection_pool.putconn(conn)
        elif self.is_production and self.postgres_url:
            # Production but pool failed - fallback to direct connection
            conn = psycopg2.connect(self.postgres_url, cursor_factory=RealDictCursor)
            try:
                yield conn
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()
        else:
            # Development: Use SQLite (no pooling needed)
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            try:
                yield conn
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()

    def close_pool(self):
        """Close all connections in the pool (call on app shutdown)"""
        if self.connection_pool:
            self.connection_pool.closeall()
            print("✓ Connection pool closed")

    # ... rest of the class remains the same (execute_query, execute_many, etc.) ...
```

**Step 2.3.3: Add Pool Cleanup on App Shutdown**

**File:** `backend/app.py`

**Location:** Add at the end of the file (before `if __name__ == "__main__":`)

**Add:**
```python
import atexit
from database.db_config import db_config

# Register cleanup function to close connection pool on shutdown
@atexit.register
def cleanup_db_pool():
    """Close database connection pool on app shutdown"""
    print("Shutting down database connection pool...")
    db_config.close_pool()
```

**Step 2.3.4: Add Pool Status Endpoint**

**File:** `backend/api/database_routes.py`

**Location:** Add at the end of file

**Add:**
```python
@db_routes.route("/pool/status", methods=["GET"])
def get_pool_status():
    """Get connection pool status (production only)"""
    try:
        if not db_config.is_production:
            return jsonify({
                "status": "success",
                "data": {
                    "type": "sqlite",
                    "pooling": False,
                    "message": "SQLite does not use connection pooling"
                }
            })
        
        if not db_config.connection_pool:
            return jsonify({
                "status": "success",
                "data": {
                    "type": "postgres",
                    "pooling": False,
                    "message": "Connection pool not initialized (using direct connections)"
                }
            })
        
        # Get pool statistics (only available in newer psycopg2 versions)
        # For basic info, we can't get detailed stats without custom tracking
        return jsonify({
            "status": "success",
            "data": {
                "type": "postgres",
                "pooling": True,
                "min_connections": 2,
                "max_connections": 20,
                "message": "Connection pool is active"
            }
        })
    
    except Exception as e:
        logger.error(f"Pool status error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
```

**Step 2.3.5: Test Connection Pooling**

**Test 1: Verify pool initialization**
```bash
cd backend
python3 app.py

# Expected output:
# ✓ PostgreSQL connection pool initialized (2-20 connections)
# OR (if using SQLite):
# ✓ Using SQLite database: /path/to/stocks.db
```

**Test 2: Test pool status endpoint**
```bash
# With SQLite (development)
curl http://127.0.0.1:5001/api/database/pool/status

# Expected:
{
  "status": "success",
  "data": {
    "type": "sqlite",
    "pooling": false,
    "message": "SQLite does not use connection pooling"
  }
}

# With PostgreSQL (production - if POSTGRES_URL is set)
POSTGRES_URL=your_postgres_url python3 app.py

curl http://127.0.0.1:5001/api/database/pool/status

# Expected:
{
  "status": "success",
  "data": {
    "type": "postgres",
    "pooling": true,
    "min_connections": 2,
    "max_connections": 20,
    "message": "Connection pool is active"
  }
}
```

**Test 3: Performance comparison**

**Create test script:** `backend/test_connection_pool.py`

```python
#!/usr/bin/env python3
"""
Test connection pooling performance
"""

import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_config import db_config

def test_query_performance(iterations=10):
    """Test query performance with connection pooling"""
    
    print(f"Running {iterations} queries...")
    print(f"Database type: {'PostgreSQL' if db_config.is_production else 'SQLite'}")
    print(f"Connection pooling: {'Enabled' if db_config.connection_pool else 'Disabled'}")
    print()
    
    times = []
    
    for i in range(iterations):
        start = time.time()
        
        result = db_config.execute_query(
            "SELECT COUNT(*) as count FROM stocks",
            fetch_one=True
        )
        
        elapsed = (time.time() - start) * 1000  # Convert to ms
        times.append(elapsed)
        
        print(f"Query {i+1}: {elapsed:.2f}ms (count: {result['count']})")
    
    print()
    print(f"Average: {sum(times)/len(times):.2f}ms")
    print(f"Min: {min(times):.2f}ms")
    print(f"Max: {max(times):.2f}ms")

if __name__ == "__main__":
    test_query_performance()
```

**Run test:**
```bash
cd backend
python3 test_connection_pool.py

# Without pooling (SQLite), expect:
# Average: 15-30ms per query

# With pooling (PostgreSQL), expect:
# Query 1: 80-100ms (initial connection)
# Query 2-10: 5-15ms (reused connection)
# Average: 15-25ms (vs 50-100ms without pooling)
```

**Step 2.3.6: Configure Pool Size for Production**

**File:** `backend/database/db_config.py`

**Location:** In the `__init__` method, connection pool creation

**Make pool size configurable:**
```python
# Create threaded connection pool with configurable size
min_conn = int(os.getenv("DB_POOL_MIN", "2"))
max_conn = int(os.getenv("DB_POOL_MAX", "20"))

self.connection_pool = pool.ThreadedConnectionPool(
    minconn=min_conn,
    maxconn=max_conn,
    dsn=self.postgres_url
)
print(f"✓ PostgreSQL connection pool initialized ({min_conn}-{max_conn} connections)")
```

**For Vercel deployment, set environment variables:**
```bash
# In Vercel dashboard → Environment Variables
DB_POOL_MIN=3
DB_POOL_MAX=10  # Lower for serverless (each function instance has its own pool)
```

### Success Criteria
- ✅ Connection pool initialized on startup
- ✅ Pool status endpoint returns correct info
- ✅ Queries reuse connections (measured in test script)
- ✅ 50% faster average query time in production
- ✅ Pool closes cleanly on shutdown
- ✅ No connection leaks (verify with pg_stat_activity)

### Performance Benchmarks

**Before (no pooling):**
```
Query 1: 80ms (create connection + query)
Query 2: 75ms (create connection + query)
Query 3: 82ms (create connection + query)
Average: 79ms per query
```

**After (with pooling):**
```
Query 1: 80ms (create initial connections)
Query 2: 12ms (reuse connection)
Query 3: 10ms (reuse connection)
Average: 34ms per query (57% improvement!)
```

### Rollback Plan
If connection pooling causes issues:
1. Set `USE_SQLITE=true` to fallback to SQLite
2. Or comment out pool creation in `db_config.py` (will use direct connections)
3. Restart backend

---

## Task 2.4: Lazy Load ChatAssistant Component

**Priority:** P1 - High  
**Estimated Time:** 30 minutes  
**Dependencies:** None  
**Impact:** -45KB initial bundle, -200ms FCP

### Context
The `ChatAssistant` component is imported globally in `layout.tsx`, which means its 45KB of code (including Markdown renderer, UUID generation, etc.) is downloaded on EVERY page load, even though most users never open the chat.

### Implementation Steps

**Step 2.4.1: Update Layout to Use Dynamic Import**

**File:** `frontend/app/layout.tsx`

**Location:** Find the ChatAssistant import (around line 5)

**Before:**
```typescript
import ChatAssistant from "@/components/ChatAssistant";
```

**Replace with:**
```typescript
import dynamic from 'next/dynamic';

// Lazy load ChatAssistant - only downloaded when user opens chat
const ChatAssistant = dynamic(
  () => import('@/components/ChatAssistant'),
  { 
    ssr: false,  // Client-only component
    loading: () => null  // No loading spinner needed (instant render)
  }
);
```

**Step 2.4.2: Verify Bundle Size Reduction**

**Terminal:**
```bash
cd frontend

# Build the app
npm run build

# Look for the output showing bundle sizes
# You should see ChatAssistant in a separate chunk, not in the main bundle
```

**Expected output:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         92.1 kB
├ ○ /dashboard                           3.8 kB         90.7 kB  
├ ○ /stocks                              12.4 kB        99.3 kB
└ ○ /portfolio                           8.6 kB         95.5 kB

+ Lazy loaded chunks:
  └ ChatAssistant                        45.2 kB  ← Only loaded when opened!
```

**Before lazy loading:**
```
Main bundle: 195 KB (includes ChatAssistant)
```

**After lazy loading:**
```
Main bundle: 150 KB (45 KB reduction - 23% smaller!)
ChatAssistant chunk: 45 KB (loaded on demand)
```

**Step 2.4.3: Test Lazy Loading Behavior**

**Test in browser:**
```bash
npm run dev

# Open http://localhost:3000
# Open DevTools → Network tab
# Filter by "JS"
```

**Test 1: Initial page load**
1. Reload page
2. Check Network tab
3. **Expected:** ChatAssistant chunk NOT downloaded
4. Main bundle should be ~45KB smaller

**Test 2: Open chat**
1. Click the chat button
2. Check Network tab
3. **Expected:** ChatAssistant chunk downloaded now
4. Chat opens normally

**Test 3: Close and reopen chat**
1. Close chat, reopen chat
2. **Expected:** No new download (chunk cached)

**Step 2.4.4: Further Optimize - Lazy Load ChatInterface**

**File:** `frontend/components/ChatAssistant.tsx`

**Location:** Find ChatInterface import (around line 4)

**Before:**
```typescript
import { ChatInterface } from './ChatInterface';
```

**Replace with:**
```typescript
import dynamic from 'next/dynamic';

const ChatInterface = dynamic(
  () => import('./ChatInterface').then(mod => ({ default: mod.ChatInterface })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-[#ccf32f]"></div>
      </div>
    )
  }
);
```

**Modify the component to delay loading ChatInterface:**
```typescript
export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const pathname = usePathname();

    // Hide floating assistant on the dedicated chat page
    if (pathname === '/ask-klyx') return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#ccf32f] text-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center z-50 border-2 border-white"
            >
                <MessageSquare size={24} />
            </button>
        );
    }

    return (
        <div className={`
          fixed bottom-6 right-6 bg-white dark:bg-neutral-900 shadow-2xl rounded-[2rem] border border-neutral-200 dark:border-neutral-800 flex flex-col z-50 transition-all duration-300 overflow-hidden
          ${isMaximized ? 'w-[1100px] h-[80vh]' : 'w-[450px] h-[650px]'}
        `}>
            {/* Header with Controls */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ccf32f] rounded-xl flex items-center justify-center text-black">
                        <Bot size={20} />
                    </div>
                    <Typography variant="body" className="font-bold">Aura AI</Typography>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* ChatInterface - Only loads when chat is opened */}
            <ChatInterface initialMaximized={isMaximized} embedded={false} />
        </div>
    );
}
```

**Step 2.4.5: Measure Performance Impact**

**Use Lighthouse to measure:**
```bash
# Install Lighthouse CLI (if not installed)
npm install -g lighthouse

# Run Lighthouse before and after
lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./before.json

# Make the lazy loading changes

lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./after.json
```

**Expected improvements:**
- **First Contentful Paint:** -200ms to -400ms
- **Largest Contentful Paint:** -150ms to -300ms
- **Total Blocking Time:** -100ms to -200ms
- **Bundle Size:** -45KB (-23%)

### Success Criteria
- ✅ ChatAssistant code NOT in main bundle
- ✅ Chat functionality works when opened
- ✅ First page load is 200-400ms faster
- ✅ Bundle size reduced by ~45KB
- ✅ No console errors
- ✅ Chat still works perfectly when clicked

### Performance Metrics

**Before:**
```
Main bundle:     195 KB
FCP:             2.5s
LCP:             3.0s
```

**After:**
```
Main bundle:     150 KB (↓ 23%)
FCP:             2.1s (↓ 16%)
LCP:             2.6s (↓ 13%)
ChatAssistant:   45 KB (lazy loaded)
```

---

## Task 2.5: Make Authentication Non-Blocking

**Priority:** P1 - High  
**Estimated Time:** 1 hour  
**Dependencies:** None  
**Impact:** -300ms to -500ms initial page load

### Context
Currently, `AuthContext` blocks the entire app render while fetching `/auth/me`. This adds 200-500ms to EVERY page load. We need to:
1. Render the page shell immediately
2. Validate auth in the background
3. Use middleware for route protection

### Implementation Steps

**Step 2.5.1: Make AuthContext Non-Blocking**

**File:** `frontend/contexts/AuthContext.tsx`

**Location:** Modify the `useEffect` hook (around line 30)

**Before:**
```typescript
const [loading, setLoading] = useState(true);  // ← Blocks rendering

useEffect(() => {
  const token = localStorage.getItem("klyx_access_token");
  if (token) {
    fetchCurrentUser(token);  // ← Network call before render
  } else {
    setLoading(false);
  }
}, []);
```

**After:**
```typescript
const [loading, setLoading] = useState(false);  // ← Changed to false (non-blocking)

useEffect(() => {
  const token = localStorage.getItem("klyx_access_token");
  if (token) {
    // Validate token in background (don't block)
    fetchCurrentUser(token);
  }
  // App renders immediately, auth happens in background
}, []);
```

**Modify `fetchCurrentUser` to handle background validation:**
```typescript
const fetchCurrentUser = async (token: string) => {
  try {
    const response = await fetch(`${AUTH_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.data.user);
    } else {
      // Token invalid, clear it
      console.warn("Token validation failed, clearing auth");
      localStorage.removeItem("klyx_access_token");
      localStorage.removeItem("klyx_refresh_token");
      setUser(null);
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    // Don't clear tokens on network error (might be temporary)
    // Just log and retry later
  }
  // Note: No setLoading(false) - we don't block on this
};
```

**Step 2.5.2: Create Middleware for Route Protection**

**File:** `frontend/middleware.ts` (NEW FILE - create at root of frontend directory)

**Create with:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/portfolio',
  '/stocks',
  '/dashboard',
  '/debt-optimizer',
  '/ask-klyx',
];

// Public routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth token in cookies or headers
  const token = request.cookies.get('klyx_access_token')?.value;
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);  // Remember where they wanted to go
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Step 2.5.3: Update Login to Store Token in Cookie**

**File:** `frontend/contexts/AuthContext.tsx`

**Location:** Modify the `login` function (around line 70)

**Add cookie storage alongside localStorage:**
```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      // Store tokens in localStorage
      localStorage.setItem("klyx_access_token", data.data.access_token);
      localStorage.setItem("klyx_refresh_token", data.data.refresh_token);
      
      // Also store in cookie for middleware
      document.cookie = `klyx_access_token=${data.data.access_token}; path=/; max-age=${60 * 60}`; // 1 hour
      
      setUser(data.data.user);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
};
```

**Update logout to clear cookie:**
```typescript
const logout = async () => {
  try {
    const token = localStorage.getItem("klyx_access_token");
    if (token) {
      await fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local state and tokens
    setUser(null);
    localStorage.removeItem("klyx_access_token");
    localStorage.removeItem("klyx_refresh_token");
    
    // Clear cookie
    document.cookie = "klyx_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
};
```

**Step 2.5.4: Add Loading State for Protected Routes**

**File:** `frontend/app/portfolio/page.tsx`

**Location:** Add early return for auth loading (around line 40)

**Add this check at the start of the component:**
```typescript
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Show loading state only for initial auth check
  // This will be very brief now (non-blocking)
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-[#ccf32f]"></div>
      </div>
    );
  }
  
  // Rest of component...
```

**Step 2.5.5: Handle Redirect After Login**

**File:** `frontend/app/login/page.tsx`

**Location:** Modify the `handleSubmit` function (around line 20)

**Update to handle redirect parameter:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  const success = await login(email, password);

  if (success) {
    // Check if there's a redirect URL from middleware
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    // Redirect to intended page or dashboard
    router.push(redirect || '/dashboard');
  } else {
    setError("Invalid email or password");
    setLoading(false);
  }
};
```

**Step 2.5.6: Test Non-Blocking Auth**

**Test 1: Measure page load time**
```bash
cd frontend
npm run dev

# Open Chrome DevTools → Network tab
# Reload http://localhost:3000/dashboard
# Measure time to First Contentful Paint
```

**Before (blocking auth):**
```
Page starts loading → waits for /auth/me (300ms) → renders content
Total: 300ms + render time
```

**After (non-blocking auth):**
```
Page starts loading → renders immediately → /auth/me happens in background
Total: render time only (300ms saved!)
```

**Test 2: Verify middleware protection**
```bash
# Test 1: Access protected route without token
# 1. Clear cookies/localStorage
# 2. Navigate to http://localhost:3000/portfolio
# Expected: Redirect to /login?redirect=/portfolio

# Test 2: Login and verify redirect
# 1. Login successfully
# Expected: Redirect to /portfolio (the original destination)

# Test 3: Access login with valid token
# 1. Be logged in
# 2. Navigate to http://localhost:3000/login
# Expected: Redirect to /dashboard
```

**Test 3: Verify background auth**
```bash
# 1. Login successfully
# 2. Open DevTools → Application → Cookies
# 3. Verify klyx_access_token cookie exists
# 4. Reload page
# 5. Check Network tab
# Expected: /auth/me request happens but doesn't block render
```

### Success Criteria
- ✅ Pages render immediately (no waiting for auth)
- ✅ Middleware redirects work correctly
- ✅ Protected routes require authentication
- ✅ Auth validation happens in background
- ✅ Login redirects to intended destination
- ✅ Page load 200-500ms faster
- ✅ No flash of incorrect content

### Performance Metrics

**Before:**
```
Load /dashboard:
├─ Wait for AuthContext mount
├─ Fetch /auth/me (300ms)
└─ Render content
Total: 300ms + render
```

**After:**
```
Load /dashboard:
├─ Middleware checks cookie (<1ms)
├─ Render immediately
└─ /auth/me validates in background
Total: render time only (300ms saved!)
```

---

# PHASE 3: ARCHITECTURE REFACTOR (WEEK 3-4)

## Task 3.1: Setup Celery + Redis for Background Jobs

**Priority:** P0 - Critical  
**Estimated Time:** 3 hours  
**Dependencies:** Phase 1 & 2 complete  
**Impact:** Enables long-running tasks, eliminates timeouts

### Context
The `/api/process` endpoint takes 20+ minutes to run, which:
- Times out on Vercel (10 second limit)
- Blocks the HTTP worker
- Poor user experience (staring at loading spinner)

We need Celery to run tasks in the background.

### Implementation Steps

**Step 3.1.1: Install Redis Locally (Development)**

**macOS:**
```bash
# Install Redis via Homebrew
brew install redis

# Start Redis server
brew services start redis

# Verify Redis is running
redis-cli ping
# Expected: PONG
```

**Linux:**
```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Verify
redis-cli ping
# Expected: PONG
```

**Step 3.1.2: Install Celery and Redis Client**

**File:** `backend/requirements.txt`

**Add:**
```txt
celery==5.3.4
redis==5.0.1
```

**Install:**
```bash
cd backend
pip3 install celery==5.3.4 redis==5.0.1

# Verify
python3 -c "import celery; print(f'Celery {celery.__version__}')"
python3 -c "import redis; print(f'Redis client installed')"
```

**Step 3.1.3: Create Celery Application**

**File:** `backend/celery_app.py` (NEW FILE)

**Create with:**
```python
"""
Celery application for background tasks.

Usage:
    # Start worker
    celery -A celery_app worker --loglevel=info
    
    # Monitor tasks
    celery -A celery_app events
"""

import os
from celery import Celery

# Redis connection URL
# Development: redis://localhost:6379/0
# Production: Use REDIS_URL environment variable
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Create Celery app
celery_app = Celery(
    'klyx',
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={
        'master_name': 'mymaster'
    },
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Only fetch 1 task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge task after completion (not before)
    task_reject_on_worker_lost=True,  # Retry if worker crashes
    
    # Retry settings
    task_default_retry_delay=60,  # Retry after 60 seconds
    task_max_retries=3,
)

# Auto-discover tasks in the tasks module
celery_app.autodiscover_tasks(['tasks'])

if __name__ == '__main__':
    celery_app.start()
```

**Step 3.1.4: Create Tasks Module**

**File:** `backend/tasks/__init__.py` (NEW FILE - create directory first)

```bash
cd backend
mkdir tasks
touch tasks/__init__.py
```

**File:** `backend/tasks/portfolio_tasks.py` (NEW FILE)

**Create with:**
```python
"""
Background tasks for portfolio processing
"""

import os
import sys
import time
from celery import Task
from celery.utils.log import get_task_logger

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from celery_app import celery_app
import clean_data
import enrich_data
import generate_insights

logger = get_task_logger(__name__)


class CallbackTask(Task):
    """Base task with progress callback support"""
    
    def update_progress(self, current, total, message=""):
        """Update task progress"""
        self.update_state(
            state='PROGRESS',
            meta={
                'current': current,
                'total': total,
                'percent': int((current / total) * 100) if total > 0 else 0,
                'message': message
            }
        )


@celery_app.task(bind=True, base=CallbackTask, name='tasks.process_portfolio')
def process_portfolio_task(self, user_id, use_multi_source=False):
    """
    Background task to process portfolio data.
    
    Args:
        user_id: User ID who requested the processing
        use_multi_source: Whether to use multi-source enrichment
        
    Returns:
        dict: Processing results
    """
    logger.info(f"Starting portfolio processing for user {user_id}")
    
    try:
        # Step 1: Clean data (33% progress)
        self.update_progress(1, 3, "Cleaning and merging data files...")
        logger.info("Step 1/3: Cleaning data...")
        clean_data.main()
        
        # Step 2: Enrich data (66% progress)
        self.update_progress(2, 3, "Enriching with external data sources...")
        logger.info("Step 2/3: Enriching data...")
        
        if use_multi_source:
            import enrich_data_v2
            enrich_data_v2.main()
        else:
            enrich_data.main()
        
        # Step 3: Generate insights (100% progress)
        self.update_progress(3, 3, "Generating insights and analysis...")
        logger.info("Step 3/3: Generating insights...")
        generate_insights.main()
        
        logger.info(f"Portfolio processing completed for user {user_id}")
        
        return {
            'status': 'completed',
            'user_id': user_id,
            'message': 'Portfolio analysis completed successfully',
            'timestamp': time.time()
        }
        
    except Exception as e:
        logger.error(f"Portfolio processing failed for user {user_id}: {str(e)}")
        raise


@celery_app.task(name='tasks.enrich_stock_database')
def enrich_stock_database_task(batch_size=10, max_stocks=None):
    """
    Background task to enrich stock database with external data.
    
    Args:
        batch_size: Number of stocks to process in each batch
        max_stocks: Maximum number of stocks to enrich (None = all)
        
    Returns:
        dict: Enrichment results
    """
    logger.info(f"Starting database enrichment (batch_size={batch_size}, max_stocks={max_stocks})")
    
    try:
        from database.stock_populator import StockDataPopulator
        
        populator = StockDataPopulator()
        result = populator.enrich_stock_data(
            batch_size=batch_size,
            max_stocks=max_stocks
        )
        
        logger.info(f"Database enrichment completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Database enrichment failed: {str(e)}")
        raise


@celery_app.task(name='tasks.refresh_stock_database')
def refresh_stock_database_task(full_refresh=False):
    """
    Background task to refresh stock database.
    
    Args:
        full_refresh: If True, refresh all stocks. If False, only stale data.
        
    Returns:
        dict: Refresh results
    """
    logger.info(f"Starting database refresh (full={full_refresh})")
    
    try:
        from database.stock_populator import StockDataPopulator, StockListFetcher
        
        populator = StockDataPopulator()
        results = {}
        
        # Step 1: Update stock list
        logger.info("Fetching stock list...")
        stock_list = StockListFetcher.get_nse_stock_list()
        pop_result = populator.populate_initial_stocks(stock_list)
        results['populate'] = pop_result
        
        # Step 2: Enrich stocks
        logger.info("Enriching stocks...")
        max_stocks = None if full_refresh else 50
        enrich_result = populator.enrich_stock_data(max_stocks=max_stocks)
        results['enrich'] = enrich_result
        
        # Step 3: Get stats
        stats = populator.get_database_stats()
        results['stats'] = stats
        
        logger.info(f"Database refresh completed: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Database refresh failed: {str(e)}")
        raise
```

**Step 3.1.5: Update Flask App to Use Celery**

**File:** `backend/app.py`

**Location:** Add imports at top (around line 10)

**Add:**
```python
from celery_app import celery_app
from tasks.portfolio_tasks import process_portfolio_task
```

**Location:** Update the `/api/process` endpoint (around line 120)

**Replace with:**
```python
@app.route("/api/process", methods=["POST"])
@jwt_required()  # Require authentication
def process_data():
    """
    Start background portfolio processing task.
    Returns task ID for status tracking.
    """
    try:
        user_id = get_jwt_identity()
        
        # Check if user wants multi-source enrichment
        use_multi_source = (
            request.json.get("use_multi_source", False) if request.json else False
        )
        
        # Start background task
        task = process_portfolio_task.delay(user_id, use_multi_source)
        
        return jsonify({
            "status": "processing",
            "task_id": task.id,
            "message": "Portfolio processing started in background",
            "check_status_url": f"/api/process/status/{task.id}"
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
```

**Add new status endpoint:**
```python
@app.route("/api/process/status/<task_id>", methods=["GET"])
@jwt_required()
def check_process_status(task_id):
    """
    Check the status of a background processing task.
    
    Returns:
        {
            "status": "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE",
            "progress": { current, total, percent, message },
            "result": { ... } (if completed)
        }
    """
    try:
        task = celery_app.AsyncResult(task_id)
        
        response = {
            "status": task.state,
            "task_id": task_id
        }
        
        if task.state == 'PENDING':
            response['message'] = 'Task is waiting to start...'
            
        elif task.state == 'PROGRESS':
            response['progress'] = task.info
            response['message'] = task.info.get('message', 'Processing...')
            
        elif task.state == 'SUCCESS':
            response['result'] = task.result
            response['message'] = 'Processing completed successfully'
            
        elif task.state == 'FAILURE':
            response['error'] = str(task.info)
            response['message'] = 'Processing failed'
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
```

**Step 3.1.6: Start Celery Worker**

**Terminal 1 - Redis:**
```bash
# Redis should already be running
# Verify:
redis-cli ping
# Expected: PONG
```

**Terminal 2 - Celery Worker:**
```bash
cd backend

# Start Celery worker
celery -A celery_app worker --loglevel=info

# Expected output:
# -------------- celery@YourHostname v5.3.4
# ---- **** -----
# --- * ***  * -- Darwin-23.3.0-x86_64-i386-64bit 2025-12-28
# -- * - **** ---
# - ** ---------- [config]
# - ** ---------- .> app:         klyx:0x...
# - ** ---------- .> transport:   redis://localhost:6379/0
# - ** ---------- .> results:     redis://localhost:6379/0
# - *** --- * --- .> concurrency: 8 (prefork)
# -- ******* ---- .> task events: OFF
# --- ***** -----
#  -------------- [queues]
#                 .> celery           exchange=celery(direct) key=celery
#
# [tasks]
#   . tasks.process_portfolio
#   . tasks.enrich_stock_database
#   . tasks.refresh_stock_database
#
# [2025-12-28 10:00:00,000: INFO/MainProcess] Connected to redis://localhost:6379/0
# [2025-12-28 10:00:00,001: INFO/MainProcess] mingle: searching for neighbors
# [2025-12-28 10:00:01,015: INFO/MainProcess] mingle: all alone
# [2025-12-28 10:00:01,025: INFO/MainProcess] celery@YourHostname ready.
```

**Terminal 3 - Flask Backend:**
```bash
cd backend
python3 app.py

# Should start normally on port 5001
```

**Step 3.1.7: Test Background Task Execution**

**Test 1: Start a task**
```bash
# Get JWT token first (login)
TOKEN=$(curl -X POST http://127.0.0.1:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.data.access_token')

# Start processing task
RESPONSE=$(curl -X POST http://127.0.0.1:5001/api/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"use_multi_source":false}')

echo $RESPONSE

# Expected:
{
  "status": "processing",
  "task_id": "abc-123-def-456",
  "message": "Portfolio processing started in background",
  "check_status_url": "/api/process/status/abc-123-def-456"
}
```

**Test 2: Check task status**
```bash
# Extract task ID from response
TASK_ID=$(echo $RESPONSE | jq -r '.task_id')

# Check status immediately
curl http://127.0.0.1:5001/api/process/status/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected (while running):
{
  "status": "PROGRESS",
  "task_id": "abc-123-def-456",
  "progress": {
    "current": 1,
    "total": 3,
    "percent": 33,
    "message": "Cleaning and merging data files..."
  },
  "message": "Cleaning and merging data files..."
}

# Wait 30 seconds, check again
sleep 30
curl http://127.0.0.1:5001/api/process/status/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected (when done):
{
  "status": "SUCCESS",
  "task_id": "abc-123-def-456",
  "result": {
    "status": "completed",
    "user_id": "user-123",
    "message": "Portfolio analysis completed successfully"
  },
  "message": "Processing completed successfully"
}
```

**Test 3: Watch Celery worker logs**
```bash
# In the Celery worker terminal, you should see:
[2025-12-28 10:05:00,000: INFO/MainProcess] Task tasks.process_portfolio[abc-123...] received
[2025-12-28 10:05:00,001: INFO/ForkPoolWorker-1] Starting portfolio processing for user user-123
[2025-12-28 10:05:00,002: INFO/ForkPoolWorker-1] Step 1/3: Cleaning data...
[2025-12-28 10:05:30,000: INFO/ForkPoolWorker-1] Step 2/3: Enriching data...
[2025-12-28 10:25:00,000: INFO/ForkPoolWorker-1] Step 3/3: Generating insights...
[2025-12-28 10:26:00,000: INFO/ForkPoolWorker-1] Portfolio processing completed for user user-123
[2025-12-28 10:26:00,001: INFO/ForkPoolWorker-1] Task tasks.process_portfolio[abc-123...] succeeded in 1260.0s
```

### Success Criteria
- ✅ Redis server running and accessible
- ✅ Celery worker starts without errors
- ✅ Tasks show up in worker logs
- ✅ `/api/process` returns immediately with task ID
- ✅ `/api/process/status/:id` shows progress
- ✅ Long-running tasks complete successfully
- ✅ No timeout errors

### Performance Comparison

**Before (synchronous):**
```
POST /api/process
├─ HTTP request times out after 10s (Vercel limit)
├─ User sees error
└─ Processing never completes
```

**After (Celery):**
```
POST /api/process
├─ Returns immediately (<100ms)
├─ Returns task_id
└─ User can close browser

Background (Celery worker):
├─ Processes for 20+ minutes
├─ Updates progress in Redis
└─ Completes successfully
```

---

## Task 3.2: Add Frontend Polling for Task Status

**Priority:** P1 - High  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 3.1  
**Impact:** Better UX for long-running tasks

### Context
Now that we have background tasks, we need the frontend to poll the status and show progress to the user.

### Implementation Steps

**Step 3.2.1: Create useTaskStatus Hook**

**File:** `frontend/hooks/useTaskStatus.ts` (NEW FILE)

**Create with:**
```typescript
import { useEffect, useState, useRef } from 'react';
import { api } from '@/api';

export interface TaskStatus {
  status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'UNKNOWN';
  progress?: {
    current: number;
    total: number;
    percent: number;
    message: string;
  };
  result?: any;
  error?: string;
  message?: string;
}

interface UseTaskStatusOptions {
  pollInterval?: number;  // ms between polls (default: 2000)
  onSuccess?: (result: any) => void;
  onFailure?: (error: string) => void;
}

/**
 * Hook to poll background task status
 * 
 * Usage:
 *   const { status, progress, isPolling, stopPolling } = useTaskStatus(taskId);
 */
export function useTaskStatus(
  taskId: string | null,
  options: UseTaskStatusOptions = {}
) {
  const { pollInterval = 2000, onSuccess, onFailure } = options;
  
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    status: 'UNKNOWN',
  });
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPolling(false);
  };

  const fetchStatus = async () => {
    if (!taskId) return;

    try {
      const response = await fetch(`/api/process/status/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
        }
      });

      const data = await response.json();
      setTaskStatus(data);

      // Stop polling if task completed or failed
      if (data.status === 'SUCCESS') {
        stopPolling();
        onSuccess?.(data.result);
      } else if (data.status === 'FAILURE') {
        stopPolling();
        onFailure?.(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch task status:', error);
    }
  };

  // Start polling when taskId is provided
  useEffect(() => {
    if (!taskId) {
      stopPolling();
      return;
    }

    setIsPolling(true);
    
    // Fetch immediately
    fetchStatus();

    // Then poll at intervals
    pollTimerRef.current = setInterval(fetchStatus, pollInterval);

    return () => {
      stopPolling();
    };
  }, [taskId, pollInterval]);

  return {
    status: taskStatus.status,
    progress: taskStatus.progress,
    result: taskStatus.result,
    error: taskStatus.error,
    message: taskStatus.message,
    isPolling,
    stopPolling,
  };
}
```

**Step 3.2.2: Update Portfolio Page to Use Background Processing**

**File:** `frontend/app/portfolio/page.tsx`

**Location:** Add state for task tracking (around line 30)

**Add:**
```typescript
import { useTaskStatus } from '@/hooks/useTaskStatus';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Task tracking for background processing
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // Poll task status
  const { status, progress, message, isPolling } = useTaskStatus(currentTaskId, {
    onSuccess: (result) => {
      console.log('Processing completed:', result);
      // Reload data after processing completes
      loadData();
      setCurrentTaskId(null);
    },
    onFailure: (error) => {
      console.error('Processing failed:', error);
      alert(`Processing failed: ${error}`);
      setCurrentTaskId(null);
    },
  });
  
  // ... rest of component
```

**Update handleRunAnalysis function:**
```typescript
const handleRunAnalysis = async () => {
  // 1. Verify symbols first
  try {
    const verifyRes = await api.verifySymbols();
    if (
      verifyRes.status === "success" &&
      verifyRes.invalid &&
      verifyRes.invalid.length > 0
    ) {
      setInvalidSymbols(verifyRes.invalid);
      setShowVerification(true);
      return;
    }
  } catch (e) {
    console.warn("Verification failed, skipping to analysis...", e);
  }

  // 2. Start background processing
  executeAnalysis();
};

const executeAnalysis = async () => {
  setIsProcessing(true);
  try {
    const res = await api.runAnalysis();
    
    if (res.status === "processing") {
      // Background task started
      setCurrentTaskId(res.task_id);
      console.log(`Background task started: ${res.task_id}`);
      // Don't set isProcessing false - keep it true while polling
    } else if (res.status === "success") {
      // Immediate completion (shouldn't happen with background tasks)
      await loadData();
      alert("Analysis completed successfully!");
      setIsProcessing(false);
    } else {
      alert(`Analysis failed: ${res.message}`);
      setIsProcessing(false);
    }
  } catch (e) {
    alert("Analysis failed to start.");
    setIsProcessing(false);
  }
};
```

**Add progress indicator in the UI:**
```typescript
{/* Show processing status */}
{isProcessing && (
  <div className="fixed bottom-4 right-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-sm z-50">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        {status === 'PROGRESS' ? (
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-[#ccf32f]"></div>
        ) : (
          <Loader2 className="w-8 h-8 text-[#ccf32f] animate-spin" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <Typography variant="h4" className="font-bold mb-1">
          Processing Portfolio
        </Typography>
        
        {progress && (
          <>
            <Typography variant="caption" className="text-neutral-600 dark:text-neutral-400 mb-2">
              {progress.message}
            </Typography>
            
            {/* Progress bar */}
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mb-1">
              <div
                className="bg-[#ccf32f] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            
            <Typography variant="caption" className="text-neutral-500 text-xs">
              Step {progress.current} of {progress.total} ({progress.percent}%)
            </Typography>
          </>
        )}
        
        {!progress && (
          <Typography variant="caption" className="text-neutral-600 dark:text-neutral-400">
            {message || 'Starting analysis...'}
          </Typography>
        )}
      </div>
    </div>
  </div>
)}
```

**Step 3.2.3: Update API Client**

**File:** `frontend/api.ts`

**Location:** Find `runAnalysis` function

**Update:**
```typescript
runAnalysis: async () => {
  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
    },
  });
  return res.json();
},
```

**Step 3.2.4: Test Frontend Polling**

**Test 1: Start processing and watch progress**
```bash
# Terminal 1: Celery worker running
# Terminal 2: Flask backend running
# Terminal 3: Frontend

cd frontend
npm run dev

# Open http://localhost:3000/portfolio
# 1. Upload files (or use sample data)
# 2. Click "Run Analysis"
# 3. Watch progress indicator appear
# 4. See progress bar update every 2 seconds
# 5. Watch it complete and auto-reload data
```

**Test 2: Close browser and reopen**
```bash
# 1. Start a long-running task
# 2. Note the task ID in console
# 3. Close the browser
# 4. Wait 1 minute
# 5. Reopen browser
# 6. Task should still be running in background
# 7. Check status manually:
curl http://127.0.0.1:5001/api/process/status/TASK_ID \
  -H "Authorization: Bearer TOKEN"
```

**Test 3: Error handling**
```bash
# 1. Stop Celery worker
# 2. Start a task
# 3. Task will fail
# 4. Frontend should show error after detecting FAILURE status
```

### Success Criteria
- ✅ Task starts and returns immediately
- ✅ Progress indicator shows in bottom-right
- ✅ Progress bar updates in real-time
- ✅ Completion triggers data reload
- ✅ Errors shown to user
- ✅ Can close browser while processing
- ✅ No memory leaks from polling

### User Experience Flow

**Before:**
```
Click "Run Analysis"
  ↓
Spinner for 20+ minutes
  ↓
Timeout error
  ↓
😞 Nothing works
```

**After:**
```
Click "Run Analysis"
  ↓
Instant response with task ID
  ↓
Progress indicator shows:
  "Step 1 of 3: Cleaning data... (33%)"
  ↓
  "Step 2 of 3: Enriching... (66%)"
  ↓
  "Step 3 of 3: Generating insights... (100%)"
  ↓
Auto-reload with fresh data
  ↓
😊 Success!
```

---

**REMAINING TASKS TO DOCUMENT:**
- Task 3.3: Convert Stock List to Server Component
- Task 3.4: Add Streaming with Suspense
- Task 3.5: Consolidate Flask + FastAPI
- Task 4.1-4.5: Production Hardening
- Task 5.1-5.4: Feature Enhancements

**Would you like me to continue with the remaining tasks in the same granular detail?**
