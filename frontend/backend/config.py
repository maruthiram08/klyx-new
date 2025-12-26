"""
Configuration file for API keys and data source settings.

To use Alpha Vantage or other premium data sources:
1. Copy this file to config_local.py
2. Add your API keys to config_local.py
3. config_local.py is gitignored and won't be committed

Free alternatives that don't require API keys:
- NSE (via nsepython) - Free, no API key needed
- Yahoo Finance (via yfinance) - Free, no API key needed
- MoneyControl (via pkscreener) - Free, no API key needed
"""

import os


class Config:
    """Base configuration"""

    # Alpha Vantage API (optional - for premium data)
    # Get free API key at: https://www.alphavantage.co/support/#api-key
    ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", None)

    # Twelve Data API (optional)
    # Get free API key at: https://twelvedata.com/pricing
    TWELVE_DATA_API_KEY = os.getenv("TWELVE_DATA_API_KEY", None)

    # Financial Modeling Prep (optional)
    # Get free API key at: https://site.financialmodelingprep.com/developer/docs/
    FMP_API_KEY = os.getenv("FMP_API_KEY", None)

    # Data source priority order (adjust as needed)
    # Available sources: 'nse', 'yfinance', 'moneycontrol', 'alphavantage'
    DATA_SOURCE_PRIORITY = ["nse", "yfinance", "moneycontrol"]

    # Cache settings
    ENABLE_CACHE = True
    CACHE_TTL_MINUTES = 15

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    # Rate limiting (seconds between requests)
    RATE_LIMIT_DELAY = 0.5

    # Quality thresholds
    HIGH_QUALITY_THRESHOLD = 80  # Stop early if we achieve this quality
    MIN_ACCEPTABLE_QUALITY = 50  # Warn if below this threshold


class DevelopmentConfig(Config):
    """Development configuration"""

    DEBUG = True
    LOG_LEVEL = "DEBUG"


class ProductionConfig(Config):
    """Production configuration"""

    DEBUG = False
    LOG_LEVEL = "WARNING"
    ENABLE_CACHE = True


# Try to import local config overrides (gitignored)
try:
    from config_local import LocalConfig

    config = LocalConfig()
except ImportError:
    # Use default config if no local config exists
    config = Config()
