# Data Points Documentation

**Source File**: `nifty50_unified_master.xlsx`
**Total Available Columns**: 209

---

## 1. Currently Displayed in Stock Details Page

The following data points are actively mapped and visible in the UI.

### **Header Section**
- Stock Name
- NSE Code
- Industry Name / Sector Name
- Current Price
- Day Change %
- VWAP Day
- News Sentiment (Badge)
- Technical Trend (Badge)
- Trendlyne Momentum Score (Badge)

### **Tab: Overview**
- **Performance**:
    - Day Change %
    - Month Change %
    - Qtr Change %
    - 1Yr Change %
    - Relative returns vs Nifty50 week%
    - Relative returns vs Sector month%
- **Price Range**:
    - Day High / Low
    - 1Yr High / Low
    - 5Yr High / Low

### **Tab: Technicals**
- **Oscillators & Indicators**:
    - Day RSI (14)
    - Day MACD
    - Day MFI (Money Flow Index)
    - Day ADX
    - Day ATR
    - Beta 1Year
- **Moving Averages** (Value + Signal):
    - Day SMA5
    - Day SMA20 / Day EMA20
    - Day SMA50
    - Day SMA200
- **Pivot Levels**:
    - Standard Pivot point
    - Standard Support S1, S2, S3
    - Standard Resistance R1, R2, R3

### **Tab: Fundamentals**
- **Valuation**:
    - PE TTM Price to Earnings
    - Sector PE TTM
    - PE 5Yr Average
    - Price to Book Value Adjusted (or Sector PB)
    - PEG TTM PE to Growth
- **Efficiency**:
    - ROE Annual %
    - RoA Annual %
    - Operating Profit Margin Qtr %
    - Dividend Yield Annual %
- **Growth (YoY)**:
    - Revenue Growth Annual YoY %
    - Net Profit Annual YoY Growth %
    - EPS TTM Growth %

### **Tab: Holdings**
- **Shareholding Patterns** (Current % + QoQ Change):
    - Promoter holding
    - FII holding
    - MF holding
    - Institutional holding

### **Tab: Forecasts (Currently Hidden / "Coming Soon")**
*These are mapped in code but temporarily masked in UI:*
- Forecaster Estimates Target Price
- Forecaster Estimates 12Mth Upside %
- Forecaster Estimates Reco
- Forecaster Estimates No of bullish Estimates
- Forecaster Estimates No of bearish Estimates

---

## 2. All Available Data Points (Master List)

This list includes *everything* found in the backend excel file.

### **Entity Details**
- Stock Name, NSE Code, BSE Code, Stock Code, ISIN
- Industry Name, sector_name

### **Price & Volume**
- Current Price, Market Capitalization
- VWAP Day, Day Volume, Week Volume Avg, Month Volume Avg
- Day High, Day Low, Month High, Month Low, Qtr High, Qtr Low, 5Yr High, 5Yr Low, 10Yr High, 10Yr Low
- 1Yr High, 1Yr Low

### **Performance Returns**
- Day change %, Month Change %, Qtr Change %, 1Yr change %
- 2Yr price change %, 3Yr price change %, 5Yr price change %, 10Yr price change %
- **Relative Returns vs Nifty50**: week%, month%, quarter%, year%, three years%, five years%, ten years%
- **Relative Returns vs Sensex**: week%, month%, quarter%, year%, three years%, five years%, ten years%
- **Relative Returns vs Industry**: week%, month%, quarter%, year%, three years%, five years%, ten years%
- **Relative Returns vs Sector**: month%, quarter%, year%, three years%, five years%, ten years%

### **Technicals**
- **Levels**: Standard Pivot point, R1-R3 (Values + % Diff), S1-S3 (Values + % Diff)
- **Scores**: Normalized Momentum Score, Trendlyne Momentum Score (Current, Prev Day, Prev Week, Prev Month)
- **Trendlyne Scores**: Durability Score, Valuation Score, Momentum Score (plus History: Prev Day/Week/Month)
- **Indicators**: 
    - Day MFI, Day RSI, Day MACD, Day MACD Signal Line
    - Day ADX, Day ATR, Day ROC21, Day ROC125
- **Moving Averages**: 
    - SMA: 5, 30, 50, 100, 200
    - EMA: 12, 20, 50, 100
- **Beta**: 1Month, 3Month, 1Year, 3Year

### **Fundamentals**
- **Valuation**: 
    - PE TTM, Sector PE, Industry PE, PE 3Yr Avg, PE 5Yr Avg
    - %Days traded below current PE
    - PEG TTM, Sector PEG, Industry PEG
    - Price to Book (Adjusted, Sector, Industry)
    - %Days traded below current PB
    - Piotroski Score
- **Efficiency & Ratios**:
    - Basic EPS TTM, EPS TTM Growth %
    - ROE Annual % (Stock, Sector, Industry)
    - RoA Annual % (Stock, Sector, Industry)
    - Operating Profit Margin Qtr % (Current + 4Qtr ago)
- **Financial Results**:
    - Latest financial result, Result Announced Date
    - Operating Revenue (Qtr, TTM, Annual)
    - Net Profit (Qtr, TTM, Annual)
    - Operating Profit (Annual)
    - Cash Flow: Financing, Investing, Operating, Net Cash Flow
- **Growth Metrics**:
    - Revenue Growth: QoQ %, Qtr YoY %, Annual YoY % (Stock, Sector)
    - Net Profit Growth: QoQ %, Qtr YoY %, Annual YoY % (Stock, Sector)

### **Shareholding**
- **Promoters**: Latest %, Change (QoQ, 4Qtr, 8Qtr), Pledge %, Pledge Change QoQ
- **Mutual Funds**: Current %, Change (QoQ, 1M, 2M, 3M, 4Qtr, 8Qtr)
- **FIIs**: Current %, Change (QoQ, 4Qtr, 8Qtr)
- **Institutions**: Current %, Change (QoQ, 4Qtr, 8Qtr)

### **Analyst Forecasts (Forecaster Estimates)**
- Target Price, 12Mth Upside %, Recommendation
- Bullish/Bearish Estimate Counts
- **Forward P/E**: 1Y forward PE, 1Y forward PEG
- **Estimates (Quarter)**: Revenue, Net Income, EPS, EBITDA, Interest Expense
- **Estimates (Annual)**: Revenue (Value + Growth), Net Income (Value + Growth), EPS (Value + Growth), EBITDA, Cash From Ops, Dep & Amort, Dividend Yield
- **Surprises**: Revenue/Net Income/EPS Surprise % (Quarter & Annual)
