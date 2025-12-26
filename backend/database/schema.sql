-- Stock Database Schema for Vercel Postgres
-- Designed for NSE/BSE stock screening application

-- Main stocks table with all fundamental and technical data
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,

    -- Identifiers
    stock_name VARCHAR(255) NOT NULL,
    nse_code VARCHAR(50) UNIQUE,
    bse_code VARCHAR(50),
    isin VARCHAR(50),
    stock_code VARCHAR(50),

    -- Classification
    industry_name VARCHAR(255),
    sector_name VARCHAR(255),

    -- Price Data
    current_price DECIMAL(15, 2),
    day_change_pct DECIMAL(10, 4),
    week_change_pct DECIMAL(10, 4),
    month_change_pct DECIMAL(10, 4),
    qtr_change_pct DECIMAL(10, 4),
    year_1_change_pct DECIMAL(10, 4),
    year_3_change_pct DECIMAL(10, 4),

    market_cap DECIMAL(20, 2),

    -- Valuation Ratios
    pe_ttm DECIMAL(10, 4),
    pb_ratio DECIMAL(10, 4),
    ps_ratio DECIMAL(10, 4),
    peg_ratio DECIMAL(10, 4),

    -- Profitability Metrics
    roe_annual_pct DECIMAL(10, 4),
    roa_annual_pct DECIMAL(10, 4),
    operating_margin_pct DECIMAL(10, 4),
    net_profit_margin_pct DECIMAL(10, 4),

    -- Growth Metrics
    revenue_growth_yoy_pct DECIMAL(10, 4),
    profit_growth_yoy_pct DECIMAL(10, 4),
    eps_growth_pct DECIMAL(10, 4),

    -- Financial Health
    debt_to_equity DECIMAL(10, 4),
    current_ratio DECIMAL(10, 4),

    -- Revenue & Profit (in Crores)
    revenue_annual DECIMAL(20, 2),
    revenue_qtr DECIMAL(20, 2),
    net_profit_annual DECIMAL(20, 2),
    net_profit_qtr DECIMAL(20, 2),

    -- Technical Indicators
    rsi DECIMAL(10, 4),
    macd DECIMAL(10, 4),
    adx DECIMAL(10, 4),
    beta_1yr DECIMAL(10, 4),

    -- Moving Averages
    sma_50 DECIMAL(15, 2),
    sma_200 DECIMAL(15, 2),
    ema_20 DECIMAL(15, 2),

    -- Momentum
    momentum_score INTEGER,

    -- Dividends
    dividend_yield_pct DECIMAL(10, 4),

    -- Holdings (in %)
    promoter_holding_pct DECIMAL(10, 4),
    fii_holding_pct DECIMAL(10, 4),
    dii_holding_pct DECIMAL(10, 4),
    mf_holding_pct DECIMAL(10, 4),

    -- Data Quality
    data_quality_score INTEGER,
    data_sources TEXT,

    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for fast querying
    CONSTRAINT unique_nse_code UNIQUE(nse_code)
);

-- Indexes for common screening queries
CREATE INDEX IF NOT EXISTS idx_sector ON stocks(sector_name);
CREATE INDEX IF NOT EXISTS idx_industry ON stocks(industry_name);
CREATE INDEX IF NOT EXISTS idx_market_cap ON stocks(market_cap);
CREATE INDEX IF NOT EXISTS idx_pe_ratio ON stocks(pe_ttm);
CREATE INDEX IF NOT EXISTS idx_roe ON stocks(roe_annual_pct);
CREATE INDEX IF NOT EXISTS idx_last_updated ON stocks(last_updated);

-- Stock metadata table for additional info
CREATE TABLE IF NOT EXISTS stock_metadata (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,

    -- Additional Info
    company_description TEXT,
    website VARCHAR(255),
    listing_date DATE,

    -- 52-week range
    week_52_high DECIMAL(15, 2),
    week_52_low DECIMAL(15, 2),

    -- Year range
    year_1_high DECIMAL(15, 2),
    year_1_low DECIMAL(15, 2),

    -- Balance Sheet (in Crores)
    total_assets DECIMAL(20, 2),
    current_assets DECIMAL(20, 2),
    total_debt DECIMAL(20, 2),
    current_liabilities DECIMAL(20, 2),
    stockholders_equity DECIMAL(20, 2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data refresh log
CREATE TABLE IF NOT EXISTS data_refresh_log (
    id SERIAL PRIMARY KEY,
    refresh_type VARCHAR(50), -- 'full', 'incremental', 'single_stock'
    stocks_updated INTEGER,
    stocks_failed INTEGER,
    duration_seconds INTEGER,
    status VARCHAR(50), -- 'success', 'partial', 'failed'
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User screener presets (for saving custom screens)
CREATE TABLE IF NOT EXISTS user_screeners (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255), -- For future user auth
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL, -- Store filter criteria as JSON
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create view for quick screener access
CREATE OR REPLACE VIEW screener_view AS
SELECT
    s.id,
    s.stock_name,
    s.nse_code,
    s.sector_name,
    s.industry_name,
    s.current_price,
    s.day_change_pct,
    s.market_cap,
    s.pe_ttm,
    s.pb_ratio,
    s.roe_annual_pct,
    s.roa_annual_pct,
    s.revenue_growth_yoy_pct,
    s.profit_growth_yoy_pct,
    s.debt_to_equity,
    s.current_ratio,
    s.dividend_yield_pct,
    s.promoter_holding_pct,
    s.data_quality_score,
    s.last_updated
FROM stocks s
WHERE s.data_quality_score >= 50  -- Only include stocks with decent data quality
ORDER BY s.market_cap DESC;

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for stock_metadata
CREATE TRIGGER update_stock_metadata_updated_at BEFORE UPDATE ON stock_metadata
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
