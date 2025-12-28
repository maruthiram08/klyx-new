# SQLite Database Schema (Local Development)

**Database Path:** `backend/database/stocks.db`  
**Row Count:** 2,221 stocks + user data

---

## Tables Overview

| Table | Rows | Purpose |
|-------|------|---------|
| stocks | 2,221 | Main stock data with fundamentals & technicals |
| users | 1 | User authentication |
| user_portfolio | 0 | User watchlists |
| chat_threads | 18 | AI chat conversation threads |
| chat_messages | 26 | Chat message history |
| debt_scenarios | 0 | Debt optimizer saved scenarios |
| user_screeners | 0 | Custom screener presets |
| stock_metadata | 0 | Extended stock info (not used) |
| data_refresh_log | 0 | Background job logs |

---

## Table Schemas

### stocks (Main Data - 58 columns)

**Identifiers:**
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK, Auto-increment |
| stock_name | TEXT(255) | NOT NULL |
| nse_code | TEXT(50) | Unique index |
| bse_code | TEXT(50) | |
| isin | TEXT(50) | |
| stock_code | TEXT(50) | |

**Classification:**
| Column | Type |
|--------|------|
| industry_name | TEXT(255) |
| sector_name | TEXT(255) |

**Price Data:**
| Column | Type |
|--------|------|
| current_price | REAL(15,2) |
| day_change_pct | REAL(10,4) |
| week_change_pct | REAL(10,4) |
| month_change_pct | REAL(10,4) |
| qtr_change_pct | REAL(10,4) |
| year_1_change_pct | REAL(10,4) |
| year_3_change_pct | REAL(10,4) |
| market_cap | REAL(20,2) |

**Valuation Ratios:**
| Column | Type |
|--------|------|
| pe_ttm | REAL(10,4) |
| pb_ratio | REAL(10,4) |
| ps_ratio | REAL(10,4) |
| peg_ratio | REAL(10,4) |

**Profitability:**
| Column | Type |
|--------|------|
| roe_annual_pct | REAL(10,4) |
| roa_annual_pct | REAL(10,4) |
| operating_margin_pct | REAL(10,4) |
| net_profit_margin_pct | REAL(10,4) |

**Growth:**
| Column | Type |
|--------|------|
| revenue_growth_yoy_pct | REAL(10,4) |
| profit_growth_yoy_pct | REAL(10,4) |
| eps_growth_pct | REAL(10,4) |

**Financial Health:**
| Column | Type |
|--------|------|
| debt_to_equity | REAL(10,4) |
| current_ratio | REAL(10,4) |
| revenue_annual | REAL(20,2) |
| revenue_qtr | REAL(20,2) |
| net_profit_annual | REAL(20,2) |
| net_profit_qtr | REAL(20,2) |

**Technical Indicators:**
| Column | Type |
|--------|------|
| rsi | REAL(10,4) |
| macd | REAL(10,4) |
| adx | REAL(10,4) |
| beta_1yr | REAL(10,4) |
| sma_50 | REAL(15,2) |
| sma_200 | REAL(15,2) |
| ema_20 | REAL(15,2) |

**Composite Scores (New - Dec 28):**
| Column | Type | Status |
|--------|------|--------|
| durability_score | INTEGER | ✅ Exists |
| valuation_score | INTEGER | ✅ Exists |
| momentum_score | INTEGER | ✅ Exists |
| roce_annual_pct | DECIMAL(10,4) | ✅ Exists |
| earnings_yield_pct | DECIMAL(10,4) | ✅ Exists |
| rel_strength_score | INTEGER | ✅ Exists |
| target_price | DECIMAL(10,2) | ✅ Exists |
| recommendation_key | VARCHAR(50) | ✅ Exists |
| analyst_count | INTEGER | ✅ Exists |

**Holdings:**
| Column | Type |
|--------|------|
| promoter_holding_pct | REAL(10,4) |
| fii_holding_pct | REAL(10,4) |
| dii_holding_pct | REAL(10,4) |
| mf_holding_pct | REAL(10,4) |
| dividend_yield_pct | REAL(10,4) |

**Metadata:**
| Column | Type |
|--------|------|
| data_quality_score | INTEGER |
| data_sources | TEXT |
| last_updated | DATETIME |
| created_at | DATETIME |

---

### users
| Column | Type | Constraint |
|--------|------|------------|
| id | VARCHAR(36) | PK |
| email | VARCHAR(120) | NOT NULL, UNIQUE |
| name | VARCHAR(100) | NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### user_portfolio
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK |
| user_id | VARCHAR(36) | NOT NULL, FK(users) |
| stock_name | VARCHAR(255) | NOT NULL |
| added_at | DATETIME | |

---

### chat_threads
| Column | Type | Constraint |
|--------|------|------------|
| id | VARCHAR(36) | PK |
| user_id | VARCHAR(36) | NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| is_archived | BOOLEAN | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

### chat_messages
| Column | Type | Constraint |
|--------|------|------------|
| id | VARCHAR(36) | PK |
| thread_id | VARCHAR(36) | NOT NULL |
| role | VARCHAR(20) | NOT NULL |
| content | TEXT | NOT NULL |
| created_at | DATETIME | |

---

### debt_scenarios
| Column | Type | Constraint |
|--------|------|------------|
| id | INTEGER | PK |
| user_id | VARCHAR(36) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| debts | TEXT | NOT NULL (JSON) |
| monthly_budget | FLOAT | NOT NULL |
| is_current | BOOLEAN | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## Indexes (SQLite)

SQLite auto-creates indexes for PRIMARY KEYs and UNIQUE constraints.

---

## Notes

- SQLite is used for **local development only**
- All columns exist including new Trendlyne Parity columns
- 2,221 stocks with basic data populated
- New score columns have limited data (only ~3 stocks enriched locally)
