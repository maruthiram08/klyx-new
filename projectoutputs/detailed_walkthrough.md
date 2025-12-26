# Weekend Analysis Tool: Granular Project Walkthrough

**Date**: 2025-12-22
**Goal**: Build a stock analysis tool for Nifty 50 stocks by unifying multiple data sources and applying advanced financial analysis logic.

---

## Phase 1: Data Discovery & Unification

### 1.1 Initial State
We started with a `datasource` folder containing 4 disparate Excel files:
1.  `nifty50 technicals.xlsx`
2.  `nifty50-forecasts.xlsx`
3.  `nifty50-fundamentals.xlsx`
4.  `nifty50-trendlynescores, benchmarks.xlsx`

### 1.2 Analysis (`analyze_data.py`)
- **Action**: We wrote a script to inspect headers and sample data.
- **Findings**:
    - **Significant Overlap**: Columns like `Current Price` and `Market Capitalization` existed in all files.
    - **Redundancy**: Verified that the values in these overlapping columns were identical (std dev = 0).
    - **Keys**: `NSE Code` and `Stock Name` were potential unique identifiers.
- **Decision**: The user chose **`Stock Name`** as the primary unique key for merging.

### 1.3 Data Cleaning (`clean_data.py`)
- **Action**: Created a script to sanitize and merge the files.
- **Logic**:
    - **Artifact Removal**: Dropped columns ending in `.1`, `.2` (artifacts of previous exports).
    - **De-duplication**: Kept `Current Price` and `Market Cap` only from the master file (`technicals`), dropping them from the other 3 during the merge.
    - **Merging**: Performed an Outer Join on `Stock Name`.
- **Output**: `nifty50_unified_master.xlsx` (50 Rows, ~213 Columns).
- **Verification**: Confirmed no duplicate columns or rows remained.

---

## Phase 2: Skill Acquisition

### 2.1 Sourcing logic
- **Input**: User provided a GitHub link to Anthropics' `claude-cookbooks` (Financial Analysis Skill).
- **Action**:
    - Cloned the repository.
    - Extracted `skills/custom_skills/analyzing-financial-statements` into a local `myskills/` folder.
    - Cleaned up the temporary clone.

### 2.2 Skill Analysis (`SKILL.md`)
- **Core capabilities**: The skill calculates ratios (ROE, Liquidity, Leverage) from **raw financial line items** (e.g., "Total Assets", "Total Debt") and generates text interpretations.
- **Gap Identification**:
    - Our unified Excel file contained **pre-calculated ratios** (e.g., `ROE Annual %`).
    - It **Missing** the raw Balance Sheet data (`Total Assets`, `Total Debt`, `Current Liabilities`) required by the skill's calculator.

---

## Phase 3: Data Enrichment

### 3.1 Resolving the Gap
- **Problem**: We could not calculate Liquidity (Current Ratio) or Leverage (Debt/Equity) without raw balance sheet numbers.
- **Solution**: Use `yfinance` to fetch live data for the missing fields.

### 3.2 Implementation (`enrich_data.py`)
- **Action**: Created a script to iterate through all 50 tickers.
- **Logic**:
    - Appended `.NS` to NSE Codes (e.g., `ADANIENT.NS`).
    - Fetched `stock.balance_sheet` from Yahoo Finance.
    - Extracted 5 key metrics:
        1.  `Total Assets`
        2.  `Current Assets`
        3.  `Total Debt`
        4.  `Current Liabilities`
        5.  `Stockholders Equity`
- **Output**: `nifty50_enriched.xlsx`.
- **Status**: Successfully enriched all 50 stocks (though reliant on Yahoo's data availability).

---

## Phase 4: Insight Generation (The "Brain")

### 4.1 Hybrid Strategy (`generate_insights.py`)
We needed to marry our reliable Excel data with the new Yahoo data.
- **Strategy**:
    - **Profitability/Valuation**: Trust the **Excel file** (Trendlyne data is often cleaner for these). We injected `ROE Annual %` and `PE TTM` directly into the skill.
    - **Liquidity/Leverage**: Trust **Yahoo Finance** (since we had no other source). We let the skill calculate `Current Ratio` and `Debt/Equity` from the raw fetched data.

### 4.2 Execution
- **Action**: The script mapped every row to the Skill's expected dictionary format.
- **Logic**: Called `generate_summary()` from the skill's library.
- **Result**: A new column `Financial Insights` was generated.
    - *Example*: "ROE of 17.8% indicates strong shareholder returns. Current ratio of 0.90 suggests potential liquidity concerns..."

### 4.3 Final Deliverable
- **File**: `nifty50_final_analysis.xlsx`
- **Location**: `/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/`
- **Contents**:
    - Consolidated Data (from 4 sources).
    - Enriched Balance Sheet Data (from Yahoo).
    - Textual Financial Insights (from Claude Skill).

---

## Phase 5: Future Roadmap

### 5.1 Market Analysis Skill
- We briefly analyzed `market_analysis.md`.
- It introduces **Technical Analysis** (RSI, MACD) and **Sentiment Analysis** (News/Social).
- **Next Step**: Utilize the framework in `market_analysis.md` to add a layer of Technical signals to our existing Fundamental analysis.
