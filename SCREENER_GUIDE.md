# Stock Screener - Complete Guide

## Overview

The Weekend Analysis Tool now includes a powerful **Stock Screener** that lets you filter and discover stocks using sophisticated criteria. Whether you're looking for value stocks, growth companies, or momentum plays, the screener has you covered.

## Features

### ✅ 8 Preset Strategies
Pre-built professional screening strategies:
- **Value Investing** - Undervalued stocks with strong fundamentals
- **Growth Stocks** - High revenue and earnings growth
- **Momentum Trading** - Strong price trends and technical indicators
- **Dividend Aristocrats** - High dividend yield with stability
- **Quality Stocks** - Best-in-class fundamentals
- **GARP (Growth at Reasonable Price)** - Growth stocks at fair valuations
- **Breakout Stocks** - Technical breakouts with volume
- **Low Volatility** - Stable, defensive stocks

### ✅ Advanced Filtering
- Multiple filter criteria
- Operators: >, <, =, between, top/bottom N
- Logical combinations (AND/OR)
- Real-time results
- Sort by any metric

### ✅ Data Export
- Export results to CSV
- Save for further analysis
- Import into Excel/Google Sheets

### ✅ Rich Metrics
Filter by 50+ data points:
- Valuation (P/E, P/B, PEG)
- Profitability (ROE, ROA, margins)
- Growth (Revenue, EPS growth)
- Technical (RSI, MACD, ADX)
- Momentum (price changes, momentum score)
- Liquidity (Current ratio, Debt/Equity)
- Dividends
- Holdings (Promoter, FII, MF)

## Getting Started

### 1. Access the Screener

Navigate to the screener from the header:
```
Click "Screener" in the top navigation
```

Or directly visit:
```
http://localhost:3000/screener
```

### 2. Choose a Preset Strategy

Click any of the 8 preset strategy cards:

**Example: Value Investing**
- Automatically applies 6 filters:
  - P/E < 20
  - ROE ≥ 15%
  - Market Cap > 1000 Cr
  - Debt/Equity < 1
  - Current Ratio > 1.5
- Sorts by P/E (ascending)
- Shows matching stocks instantly

### 3. View Results

Results show:
- Number of stocks matched
- Match rate percentage
- Stock cards with key metrics
- Data quality indicators

### 4. Export Results

Click "Export CSV" to download:
- All matching stocks
- Complete data fields
- Timestamped filename

## Preset Strategies Explained

### 1. Value Investing 💎
**Goal**: Find undervalued stocks trading below intrinsic value

**Criteria**:
- P/E Ratio < 20 (and > 0)
- ROE ≥ 15%
- Market Cap > 1000 Cr
- Debt/Equity < 1
- Current Ratio > 1.5

**Best For**: Long-term investors seeking bargains

**Example Result**: Mature companies with strong balance sheets trading at a discount

---

### 2. Growth Stocks 🚀
**Goal**: Identify high-growth companies

**Criteria**:
- Revenue Growth ≥ 20% YoY
- Net Profit Growth ≥ 15% YoY
- ROE ≥ 18%
- Market Cap > 500 Cr

**Best For**: Investors seeking capital appreciation

**Example Result**: Fast-growing tech, pharma, or consumer companies

---

### 3. Momentum Trading 📈
**Goal**: Stocks with strong price momentum

**Criteria**:
- Month Change > 5%
- Quarter Change > 10%
- RSI between 40-70 (not overbought/oversold)
- Momentum Score ≥ 60
- Outperforming Nifty50

**Best For**: Short-term traders, swing traders

**Example Result**: Stocks in uptrends with positive momentum

---

### 4. Dividend Aristocrats 💰
**Goal**: High dividend yield with stability

**Criteria**:
- Dividend Yield ≥ 3%
- ROE ≥ 12%
- Debt/Equity < 0.8
- Current Ratio > 1.5
- Market Cap > 1000 Cr

**Best For**: Income investors

**Example Result**: Stable companies with consistent dividends

---

### 5. Quality Stocks ⭐
**Goal**: Best-in-class fundamentals

**Criteria**:
- ROE ≥ 20%
- ROA ≥ 10%
- Operating Margin ≥ 15%
- Debt/Equity < 0.5
- Current Ratio > 2
- Promoter Holding ≥ 50%

**Best For**: Conservative long-term investors

**Example Result**: Blue-chip companies with excellent financials

---

### 6. GARP (Growth at Reasonable Price) 🎯
**Goal**: Growth stocks at fair valuations

**Criteria**:
- Revenue Growth ≥ 15%
- P/E < 25 (and > 0)
- ROE ≥ 15%
- PEG Ratio < 1.5

**Best For**: Value investors open to growth

**Example Result**: Growing companies not yet overpriced

---

### 7. Breakout Stocks ⚡
**Goal**: Technical breakouts with momentum

**Criteria**:
- RSI between 50-75
- Day Change > 2%
- Month Change > 8%
- ADX > 25 (strong trend)
- Market Cap > 500 Cr

**Best For**: Technical traders

**Example Result**: Stocks breaking resistance levels

---

### 8. Low Volatility 🛡️
**Goal**: Stable, defensive stocks

**Criteria**:
- Beta < 0.8 (less volatile than market)
- ROE ≥ 12%
- Debt/Equity < 0.7
- Market Cap > 1000 Cr
- Dividend Yield ≥ 1.5%

**Best For**: Risk-averse investors, retirement portfolios

**Example Result**: Defensive sectors like FMCG, Pharma

---

## Custom Filtering (Advanced)

### API Usage

For custom filters, use the `/api/screener/filter` endpoint:

```javascript
POST http://localhost:5001/api/screener/filter
Content-Type: application/json

{
  "filters": [
    {"field": "ROE Annual %", "operator": "gte", "value": 20},
    {"field": "PE TTM Price to Earnings", "operator": "lt", "value": 15}
  ],
  "logic": "AND",
  "sort_by": "ROE Annual %",
  "sort_order": "desc"
}
```

### Supported Operators

| Operator | Symbol | Example |
|----------|--------|---------|
| `gt` | > | Greater than |
| `gte` | ≥ | Greater than or equal |
| `lt` | < | Less than |
| `lte` | ≤ | Less than or equal |
| `eq` | = | Equal to |
| `ne` | ≠ | Not equal to |
| `between` | ↔ | Between two values |
| `in` | ∈ | In a list |
| `not_in` | ∉ | Not in a list |
| `contains` | ⊃ | Contains substring |
| `top` | ↑ | Top N ranked |
| `bottom` | ↓ | Bottom N ranked |

### Filter Examples

**Find stocks with P/E between 10-20:**
```json
{
  "field": "PE TTM Price to Earnings",
  "operator": "between",
  "value": [10, 20]
}
```

**Top 10 stocks by Market Cap:**
```json
{
  "field": "Market Capitalization",
  "operator": "top",
  "value": 10
}
```

**Stocks in specific sectors:**
```json
{
  "field": "sector_name",
  "operator": "in",
  "value": ["Technology", "Finance"]
}
```

## Available Filter Fields

### Valuation Metrics
- `PE TTM Price to Earnings`
- `PEG TTM PE to Growth`
- `Price to Book Value Adjusted`
- `Market Capitalization`

### Profitability Metrics
- `ROE Annual %`
- `RoA Annual %`
- `Operating Profit Margin Qtr %`
- `Net Profit Annual YoY Growth %`

### Growth Metrics
- `Revenue Growth Annual YoY %`
- `Net Profit Annual YoY Growth %`
- `EPS TTM Growth %`

### Liquidity & Leverage
- `Current Ratio`
- `Debt to Equity Ratio`

### Technical Indicators
- `Day RSI`
- `Day MACD`
- `Day ADX`
- `Beta 1Year`
- `Day MFI`

### Performance Metrics
- `Day change %`
- `Month Change %`
- `Qtr Change %`
- `1Yr change %`

### Dividend Metrics
- `Dividend Yield Annual %`

### Momentum Metrics
- `Trendlyne Momentum Score`
- `Relative returns vs Nifty50 week%`

### Holdings
- `Promoter holding latest %`
- `FII holding current Qtr %`
- `MF holding current Qtr %`

## API Endpoints Reference

### Get All Presets
```
GET /api/screener/presets

Response:
{
  "status": "success",
  "presets": [
    {
      "id": "value",
      "name": "Value Investing",
      "description": "Low P/E, High ROE...",
      "filter_count": 6
    },
    ...
  ]
}
```

### Apply Preset
```
GET /api/screener/preset/{preset_name}

Example: GET /api/screener/preset/value

Response:
{
  "status": "success",
  "results": [...stocks...],
  "metadata": {
    "preset_name": "Value Investing",
    "description": "...",
    "total_matches": 12,
    "total_stocks": 50,
    "match_rate": "24.0%"
  }
}
```

### Apply Custom Filters
```
POST /api/screener/filter

Body:
{
  "filters": [...],
  "logic": "AND",
  "sort_by": "ROE Annual %",
  "sort_order": "desc"
}

Response:
{
  "status": "success",
  "results": [...],
  "metadata": {
    "total_matches": 15,
    "total_stocks": 50,
    "match_rate": "30.0%"
  }
}
```

### Get Available Fields
```
GET /api/screener/fields

Response:
{
  "status": "success",
  "fields": [
    {
      "field": "ROE Annual %",
      "category": "Profitability",
      "stats": {
        "count": 50,
        "min": 5.2,
        "max": 45.8,
        "mean": 18.5,
        "median": 16.2
      }
    },
    ...
  ]
}
```

### Get Field Statistics
```
GET /api/screener/field/{field_name}/stats

Example: GET /api/screener/field/ROE%20Annual%20%25/stats

Response:
{
  "status": "success",
  "stats": {
    "field": "ROE Annual %",
    "count": 50,
    "min": 5.2,
    "max": 45.8,
    "mean": 18.5,
    "median": 16.2,
    "std": 8.3
  }
}
```

## Use Cases & Examples

### Use Case 1: Finding Undervalued Quality Stocks

**Strategy**: Combine value and quality metrics

**Filters**:
```json
{
  "filters": [
    {"field": "PE TTM Price to Earnings", "operator": "lt", "value": 15},
    {"field": "ROE Annual %", "operator": "gte", "value": 20},
    {"field": "Debt to Equity Ratio", "operator": "lt", "value": 0.5},
    {"field": "Current Ratio", "operator": "gt", "value": 2}
  ],
  "logic": "AND",
  "sort_by": "ROE Annual %",
  "sort_order": "desc"
}
```

**Expected Results**: 5-10 high-quality stocks trading at attractive valuations

---

### Use Case 2: Momentum Scanner for Day Trading

**Strategy**: Find stocks with strong intraday momentum

**Filters**:
```json
{
  "filters": [
    {"field": "Day change %", "operator": "gt", "value": 3},
    {"field": "Day RSI", "operator": "between", "value": [50, 70]},
    {"field": "Day ADX", "operator": "gt", "value": 25}
  ],
  "logic": "AND",
  "sort_by": "Day change %",
  "sort_order": "desc"
}
```

**Expected Results**: Stocks with strong momentum suitable for intraday trading

---

### Use Case 3: Dividend Income Portfolio

**Strategy**: Build a dividend-focused portfolio

**Filters**:
```json
{
  "filters": [
    {"field": "Dividend Yield Annual %", "operator": "gte", "value": 3},
    {"field": "Promoter holding latest %", "operator": "gte", "value": 50},
    {"field": "Beta 1Year", "operator": "lt", "value": 1},
    {"field": "Debt to Equity Ratio", "operator": "lt", "value": 0.7}
  ],
  "logic": "AND",
  "sort_by": "Dividend Yield Annual %",
  "sort_order": "desc"
}
```

**Expected Results**: Stable dividend-paying stocks with low volatility

---

## Tips & Best Practices

### 1. Start with Presets
- Use presets to understand filtering logic
- Modify preset criteria based on your needs
- Combine multiple preset ideas

### 2. Don't Over-Filter
- Start with 3-5 key criteria
- Add more filters gradually
- Too many filters = no results

### 3. Check Match Rates
- <10% match rate: Very selective (good for finding gems)
- 10-30% match rate: Balanced approach
- >50% match rate: Too broad, tighten criteria

### 4. Sort Intelligently
- Value screens: Sort by P/E (ascending)
- Growth screens: Sort by Revenue Growth (descending)
- Momentum screens: Sort by % change (descending)
- Quality screens: Sort by ROE (descending)

### 5. Validate Results
- Review each matched stock individually
- Check data quality scores
- Verify with stock details view
- Cross-reference with external sources

### 6. Export for Analysis
- Export results to CSV
- Analyze in Excel/Sheets
- Track over time
- Compare different screen results

### 7. Combine with Other Tools
- Use screener to find candidates
- Check detailed fundamentals
- Review technical charts
- Read news and sentiment

## Troubleshooting

### Issue: No Results Found

**Causes**:
- Filters too restrictive
- Data not processed yet
- Incompatible filter combinations

**Solutions**:
1. Relax some filter values
2. Run data processing first (`/api/process`)
3. Try preset strategies to verify data availability
4. Check field statistics to see value ranges

### Issue: Too Many Results

**Causes**:
- Filters too broad
- Not enough discrimination

**Solutions**:
1. Add more specific criteria
2. Tighten value ranges
3. Add minimum market cap filter
4. Sort and focus on top N results

### Issue: API Errors

**Symptom**: "No data available" error

**Solution**:
```bash
# Ensure data is processed
POST /api/process

# Then try screening again
```

## Advanced: Building Custom Screeners

You can extend the screener with custom strategies:

### 1. Create Backend Preset

Edit `backend/services/screener_service.py`:

```python
@staticmethod
def my_custom_strategy() -> Dict:
    return {
        "name": "My Custom Strategy",
        "description": "My description",
        "filters": [
            {"field": "...", "operator": "...", "value": ...},
            # Add more filters
        ],
        "sort": {"field": "...", "order": "desc"}
    }

# Add to all_presets()
@staticmethod
def all_presets() -> Dict[str, Dict]:
    return {
        ...
        "custom": ScreenerPresets.my_custom_strategy()
    }
```

### 2. Update Frontend

The new preset will automatically appear in the screener UI!

## Performance Notes

- **Speed**: Screening 50 stocks takes ~100ms
- **Caching**: Results are not cached (always fresh)
- **Scalability**: Works well up to 1000 stocks
- **Optimization**: Uses pandas for efficient filtering

## Future Enhancements

Planned features:
- [ ] Visual filter builder (drag-and-drop)
- [ ] Save custom screens
- [ ] Schedule automated screening
- [ ] Email alerts for matches
- [ ] Backtesting screener strategies
- [ ] Compare multiple screens side-by-side
- [ ] Heatmaps for screened stocks

## Summary

✅ **Built**:
- 8 professional preset strategies
- Advanced filtering engine
- API endpoints for custom screening
- CSV export functionality
- Rich metrics (50+ fields)
- Real-time results

✅ **Benefits**:
- Save hours of manual research
- Discover hidden opportunities
- Systematic stock selection
- Customizable to your strategy
- Export for further analysis

✅ **Easy to Use**:
- Click preset → Get results
- No complex setup
- Visual, intuitive interface
- Works out-of-the-box

---

**Ready to find your next investment?** Head to `/screener` and start screening!
