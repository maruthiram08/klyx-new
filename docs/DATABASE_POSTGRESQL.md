# PostgreSQL Database Schema (Production - Render)

**Host:** Render PostgreSQL (via `POSTGRES_URL`)  
**Expected Rows:** 2,221 stocks + user data

---

## Tables Overview

| Table | Purpose |
|-------|---------|
| stocks | Main stock data with fundamentals & technicals |
| users | User authentication |
| user_portfolio | User watchlists |
| user_analysis | Saved stock analyses (JSON) |
| debt_scenarios | Debt optimizer saved scenarios |
| chat_threads | AI chat conversation threads |
| chat_messages | Chat message history |

---

## Table Schemas

### stocks (Main Data - Expected 60+ columns)

**Identifiers:**
| Column | Type | Constraint |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| stock_name | VARCHAR(255) | NOT NULL |
| nse_code | VARCHAR(50) | UNIQUE |
| bse_code | VARCHAR(50) | |
| isin | VARCHAR(50) | |
| stock_code | VARCHAR(50) | |

**Classification:**
| Column | Type |
|--------|------|
| industry_name | VARCHAR(255) |
| sector_name | VARCHAR(255) |

**Price Data:**
| Column | Type |
|--------|------|
| current_price | DECIMAL(15,2) |
| day_change_pct | DECIMAL(10,4) |
| week_change_pct | DECIMAL(10,4) |
| month_change_pct | DECIMAL(10,4) |
| qtr_change_pct | DECIMAL(10,4) |
| year_1_change_pct | DECIMAL(10,4) |
| year_3_change_pct | DECIMAL(10,4) |
| market_cap | DECIMAL(20,2) |

**Valuation Ratios:**
| Column | Type |
|--------|------|
| pe_ttm | DECIMAL(10,4) |
| pb_ratio | DECIMAL(10,4) |
| ps_ratio | DECIMAL(10,4) |
| peg_ratio | DECIMAL(10,4) |

**Profitability:**
| Column | Type |
|--------|------|
| roe_annual_pct | DECIMAL(10,4) |
| roa_annual_pct | DECIMAL(10,4) |
| operating_margin_pct | DECIMAL(10,4) |
| net_profit_margin_pct | DECIMAL(10,4) |

**Growth:**
| Column | Type |
|--------|------|
| revenue_growth_yoy_pct | DECIMAL(10,4) |
| profit_growth_yoy_pct | DECIMAL(10,4) |
| eps_growth_pct | DECIMAL(10,4) |

**Financial Health:**
| Column | Type |
|--------|------|
| debt_to_equity | DECIMAL(10,4) |
| current_ratio | DECIMAL(10,4) |
| revenue_annual | DECIMAL(20,2) |
| revenue_qtr | DECIMAL(20,2) |
| net_profit_annual | DECIMAL(20,2) |
| net_profit_qtr | DECIMAL(20,2) |

**Technical Indicators:**
| Column | Type |
|--------|------|
| rsi | DECIMAL(10,4) |
| macd | DECIMAL(10,4) |
| adx | DECIMAL(10,4) |
| beta_1yr | DECIMAL(10,4) |
| sma_50 | DECIMAL(15,2) |
| sma_200 | DECIMAL(15,2) |
| ema_20 | DECIMAL(15,2) |

**Composite Scores (⚠️ PENDING MIGRATION):**
| Column | Type | Status |
|--------|------|--------|
| durability_score | INTEGER | ❌ **MISSING** |
| valuation_score | INTEGER | ❌ **MISSING** |
| momentum_score | INTEGER | ❌ **MISSING** |
| roce_annual_pct | DECIMAL(10,2) | ❌ **MISSING** |
| earnings_yield_pct | DECIMAL(10,2) | ❌ **MISSING** |
| rel_strength_score | INTEGER | ❌ **MISSING** |
| target_price | DECIMAL(10,2) | ❌ **MISSING** |
| recommendation_key | VARCHAR(50) | ❌ **MISSING** |
| analyst_count | INTEGER | ❌ **MISSING** |

> **Action Required:** Run migration endpoint to add these columns:
> ```bash
> curl -X POST https://klyx-worker.onrender.com/worker/migrate
> ```

**Holdings:**
| Column | Type |
|--------|------|
| promoter_holding_pct | DECIMAL(10,4) |
| fii_holding_pct | DECIMAL(10,4) |
| dii_holding_pct | DECIMAL(10,4) |
| mf_holding_pct | DECIMAL(10,4) |
| dividend_yield_pct | DECIMAL(10,4) |

**Metadata:**
| Column | Type |
|--------|------|
| data_quality_score | INTEGER |
| data_sources | TEXT |
| last_updated | TIMESTAMP |
| created_at | TIMESTAMP |

---

### users
| Column | Type | Constraint |
|--------|------|------------|
| id | VARCHAR(36) | PRIMARY KEY |
| email | VARCHAR(120) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

### user_portfolio
| Column | Type | Constraint |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| user_id | VARCHAR(36) | FK(users), ON DELETE CASCADE |
| stock_name | VARCHAR(255) | NOT NULL |
| added_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| | | UNIQUE(user_id, stock_name) |

---

### user_analysis
| Column | Type | Constraint |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| user_id | VARCHAR(36) | FK(users), ON DELETE CASCADE |
| stock_name | VARCHAR(255) | NOT NULL |
| nse_code | VARCHAR(50) | |
| analysis_data | JSONB | Full enriched data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| | | UNIQUE(user_id, stock_name) |

---

### debt_scenarios
| Column | Type | Constraint |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| user_id | VARCHAR(36) | FK(users), ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| debts | TEXT | NOT NULL (JSON string) |
| monthly_budget | DECIMAL(15,2) | NOT NULL |
| is_current | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| | | UNIQUE(user_id, name) |

---

## Indexes (PostgreSQL)

```sql
CREATE INDEX idx_sector ON stocks(sector_name);
CREATE INDEX idx_industry ON stocks(industry_name);
CREATE INDEX idx_market_cap ON stocks(market_cap);
CREATE INDEX idx_pe_ratio ON stocks(pe_ttm);
CREATE INDEX idx_roe ON stocks(roe_annual_pct);
CREATE INDEX idx_last_updated ON stocks(last_updated);
CREATE INDEX idx_stocks_name ON stocks(stock_name);
CREATE INDEX idx_stocks_price ON stocks(current_price);
CREATE INDEX idx_stocks_day_change ON stocks(day_change_pct);
CREATE INDEX idx_stocks_nse ON stocks(nse_code);
CREATE INDEX idx_stocks_pe ON stocks(pe_ttm);
CREATE INDEX idx_stocks_roe ON stocks(roe_annual_pct);
CREATE INDEX idx_stocks_market_cap ON stocks(market_cap);
CREATE INDEX idx_stocks_data_quality ON stocks(data_quality_score);
```

---

## Key Differences: SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Types | REAL, TEXT, INTEGER | DECIMAL, VARCHAR, SERIAL |
| JSON | TEXT | JSONB (indexed) |
| Auto-increment | INTEGER PRIMARY KEY | SERIAL |
| Concurrent writes | Limited | Full support |
| IF NOT EXISTS | ❌ Not in ALTER | ✅ Supported |
| Foreign Keys | Optional | Enforced |

---

## Migration Status

| Migration | Status |
|-----------|--------|
| Base schema | ✅ Applied |
| Composite scores (9 cols) | ❌ **PENDING** |
| Indexes | ✅ Applied |

**To apply pending migration:**
```bash
curl -X POST https://klyx-worker.onrender.com/worker/migrate
```
