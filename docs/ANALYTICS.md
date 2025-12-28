# Analytics Features - Technical Documentation

## Overview

Klyx implements advanced stock screening and analysis features inspired by industry-leading platforms like Trendlyne, Screener.in, and proven investment strategies.

## Composite Scores (DVM)

### Durability Score (0-100)
**Purpose**: Measures financial health and stability.

**Algorithm**: Based on Piotroski F-Score methodology
- ROA > 0 (10 points)
- Operating Margin > 0 (10 points)
- High ROA > 10% (10 points)
- Debt/Equity < 1.0 (10 points)
- Debt/Equity < 0.1 (bonus 10 points)
- Current Ratio > 1.5 (10 points)
- Net Profit Margin > 10% (10 points)
- EPS Growth > 0 (10 points)
- Promoter Holding > 30% (10 points)
- ROE > 15% (10 points)

**Database Column**: `durability_score` (INTEGER)

### Valuation Score (0-100)
**Purpose**: Identifies undervalued stocks.

**Algorithm**: Multi-factor valuation assessment
- PE < 15 (20 points)
- PE < 30 (20 points)
- PEG < 1.5 (20 points)
- PB < 3 (20 points)
- Dividend Yield > 1% (20 points)

**Database Column**: `valuation_score` (INTEGER)

### Momentum Score (0-100)
**Purpose**: Captures price and technical strength.

**Algorithm**: Technical momentum composite
- Relative Strength percentile (40 points)
- Price proximity to 52W High (30 points)
  - >95% of 52W High: 30 points
  - >85% of 52W High: 20 points
  - >75% of 52W High: 10 points
- Price above 52W Low * 1.1 (10 points)

**Database Column**: `momentum_score` (INTEGER)

## Magic Formula (Greenblatt)

### ROCE (Return on Capital Employed)
**Purpose**: Measures capital efficiency.

**Calculation**: Currently approximated as ROE * 100
- Future enhancement: Direct ROCE = EBIT / (Total Assets - Current Liabilities)

**Database Column**: `roce_annual_pct` (DECIMAL)

### Earnings Yield
**Purpose**: Inverse of PE ratio, measures earnings relative to price.

**Calculation**: (1 / PE) * 100

**Database Column**: `earnings_yield_pct` (DECIMAL)

## CANSLIM Metrics

### Relative Strength
**Purpose**: Ranks stocks by price performance.

**Calculation**: 
1. Fetch 1-year price change for all stocks
2. Sort by performance
3. Assign percentile rank (0-99)
4. Higher = stronger relative performance

**Database Column**: `rel_strength_score` (INTEGER)

**Update Frequency**: After each batch enrichment

## Forecaster (Analyst Estimates)

### Data Source
Yahoo Finance API provides:
- `targetMeanPrice`: Average analyst price target
- `recommendationKey`: Buy/Sell/Hold consensus
- `numberOfAnalystOpinions`: Analyst coverage count

### Database Columns
- `target_price` (DECIMAL): Mean price target
- `recommendation_key` (VARCHAR): e.g., "strong_buy", "hold"
- `analyst_count` (INTEGER): Number of analysts covering the stock

### UI Display
- **With Coverage**: Shows target price, upside %, recommendation badge, analyst count
- **No Coverage**: Displays "No Analyst Coverage" message

## Data Population

### Enrichment Process
Location: `backend/database/stock_populator.py`

```python
# Scores calculated per stock
durability_score = ScoreService.calculate_durability(data)
valuation_score = ScoreService.calculate_valuation(data)
momentum_score = ScoreService.calculate_momentum(data)

# Magic Formula
roce = data.get("roe") * 100  # Approximation
earnings_yield = (1 / pe) * 100 if pe > 0 else 0

# Forecaster
target_price = data.get("target_mean_price")
recommendation_key = data.get("recommendation_key")
analyst_count = data.get("number_of_analyst_opinions")
```

### Relative Strength Update
Location: `backend/database/stock_populator.py::_update_relative_strength()`

Runs after each enrichment batch to ensure RS scores are current across all stocks.

## Screener Presets

### Magic Formula
```python
{
    "roce_annual_pct": {"gt": 15},
    "earnings_yield_pct": {"gt": 10}
}
```

### CANSLIM Growth
```python
{
    "eps_growth_pct": {"gt": 25},
    "rel_strength_score": {"gt": 80}
}
```

### DVM High Quality
```python
{
    "durability_score": {"gt": 70},
    "valuation_score": {"gt": 50},
    "momentum_score": {"gt": 60}
}
```

## Frontend Integration

### StockDetails Component
Location: `frontend/components/StockDetails.tsx`

**DVM Scores**: Displayed as colored progress bars
**Forecaster**: Conditional rendering based on `analyst_count`
**Graceful Degradation**: Shows "No Data" states for missing metrics

### Type Definitions
Location: `frontend/types.ts`

```typescript
interface Stock {
  durability_score?: number;
  valuation_score?: number;
  momentum_score?: number;
  target_price?: number;
  recommendation_key?: string;
  analyst_count?: number;
  // ... other fields
}
```

## Performance Considerations

### Database Indexes
Recommended indexes for fast filtering:
```sql
CREATE INDEX idx_durability ON stocks(durability_score);
CREATE INDEX idx_valuation ON stocks(valuation_score);
CREATE INDEX idx_momentum ON stocks(momentum_score);
CREATE INDEX idx_roce ON stocks(roce_annual_pct);
CREATE INDEX idx_rel_strength ON stocks(rel_strength_score);
```

### Caching Strategy
- Scores are recalculated during enrichment (daily)
- Frontend caches via TanStack Query (5 min TTL)
- Redis caches API responses (1 hour TTL)

## Future Enhancements

1. **ROCE Direct Calculation**: Fetch EBIT and Capital Employed from financials
2. **Sector-Relative Scores**: Normalize scores within sectors
3. **Historical Score Tracking**: Track score changes over time
4. **Custom Score Weights**: Allow users to customize DVM weights
5. **More Analyst Data**: Fetch earnings estimates, revenue forecasts

## References

- Piotroski F-Score: [Research Paper](https://www.chicagobooth.edu/~/media/FE874EE65F624AAEBD0166B1974FD74D.pdf)
- Magic Formula: "The Little Book That Beats the Market" by Joel Greenblatt
- CANSLIM: "How to Make Money in Stocks" by William O'Neil
- Trendlyne DVM: [Trendlyne Methodology](https://trendlyne.com/equity/methodology/)
