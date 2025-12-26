"""
Example local configuration file.

To use:
1. Copy this file to config_local.py
2. Add your API keys below
3. config_local.py will be automatically loaded and is gitignored

All API keys are optional. The system works fine with just the free sources
(NSE, Yahoo Finance, MoneyControl).
"""

from config import Config


class LocalConfig(Config):
    """Local configuration with your API keys"""

    # Alpha Vantage (Free tier: 5 API calls per minute, 500 per day)
    # Get your key at: https://www.alphavantage.co/support/#api-key
    ALPHA_VANTAGE_API_KEY = "YOUR_ALPHA_VANTAGE_KEY_HERE"

    # Twelve Data (Free tier: 800 API calls per day)
    # Get your key at: https://twelvedata.com/pricing
    TWELVE_DATA_API_KEY = None  # Optional

    # Financial Modeling Prep (Free tier: 250 calls per day)
    # Get your key at: https://site.financialmodelingprep.com/developer/docs/
    FMP_API_KEY = None  # Optional

    # Customize data source priority if needed
    # Available: 'nse', 'yfinance', 'moneycontrol', 'alphavantage'
    DATA_SOURCE_PRIORITY = ["nse", "yfinance", "moneycontrol", "alphavantage"]

    # Enable debug logging
    LOG_LEVEL = "DEBUG"
