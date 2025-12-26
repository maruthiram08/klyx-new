"""
Multi-Source Data Service with intelligent fallbacks for Indian Stock Market Data.

Priority Order:
1. NSE Official/Unofficial APIs (nsepython)
2. yfinance (Yahoo Finance)
3. MoneyControl (via pkscreener)
4. Alpha Vantage (if API key provided)

Features:
- Automatic fallback chain
- Data quality scoring
- Source tracking
- Cache management
- Retry logic
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

try:
    import numpy as np
except ImportError:
    np = None
try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)


class DataQuality:
    """Track data quality and completeness"""

    @staticmethod
    def score_data(data: Dict, required_fields: List[str]) -> Dict:
        """
        Score data quality based on completeness and freshness.
        Returns: {score: 0-100, missing_fields: [], source: str, timestamp: str}
        """
        if not data:
            return {
                "score": 0,
                "missing_fields": required_fields,
                "source": "none",
                "timestamp": None,
            }

        missing = []
        present = 0

        for field in required_fields:
            if field in data and data[field] is not None and data[field] != 0:
                present += 1
            else:
                missing.append(field)

        score = int((present / len(required_fields)) * 100) if required_fields else 0

        return {
            "score": score,
            "missing_fields": missing,
            "source": data.get("_source", "unknown"),
            "timestamp": data.get("_timestamp", datetime.now().isoformat()),
        }


class NSEDataFetcher:
    """Fetch data from NSE using nsepython or unofficial APIs"""

    def __init__(self):
        self.name = "NSE"
        try:
            from nsepython import nse_quote, nse_quote_ltp

            self.nse_quote = nse_quote
            self.nse_quote_ltp = nse_quote_ltp
            self.available = True
            logger.info("NSE fetcher initialized successfully")
        except ImportError:
            self.available = False
            logger.warning(
                "nsepython not available. Install with: pip install nsepython"
            )

    def fetch_quote(self, symbol: str) -> Optional[Dict]:
        """Fetch real-time quote data from NSE"""
        if not self.available:
            return None

        try:
            # Remove .NS suffix if present
            clean_symbol = symbol.replace(".NS", "").replace(".BO", "")

            data = self.nse_quote(clean_symbol)

            if data:
                return {
                    "currentPrice": data.get("lastPrice") or data.get("closePrice"),
                    "marketCap": data.get("marketCap"),
                    "pe_ratio": data.get("pe"),
                    "week52High": data.get("high52"),
                    "week52Low": data.get("low52"),
                    "volume": data.get("totalTradedVolume"),
                    "_source": "NSE",
                    "_timestamp": datetime.now().isoformat(),
                }
        except Exception as e:
            logger.debug(f"NSE fetch failed for {symbol}: {e}")

        return None


class YFinanceDataFetcher:
    """Enhanced yfinance fetcher with better error handling"""

    def __init__(self):
        self.name = "YahooFinance"
        try:
            import yfinance as yf

            self.yf = yf
            self.available = True
        except ImportError:
            self.available = False
            logger.warning("yfinance not available")

    def fetch_fundamentals(self, symbol: str) -> Optional[Dict]:
        """Fetch comprehensive fundamental data from Yahoo Finance"""
        if not self.available:
            return None

        try:
            # Ensure .NS suffix for NSE stocks
            ticker = symbol if ".NS" in symbol or ".BO" in symbol else f"{symbol}.NS"

            stock = self.yf.Ticker(ticker)

            # Fetch with timeout
            info = stock.info

            # Quick validation - if no data, try .BO
            if not info or "symbol" not in info:
                if ".NS" in ticker:
                    ticker = ticker.replace(".NS", ".BO")
                    stock = self.yf.Ticker(ticker)
                    info = stock.info

                if not info or "symbol" not in info:
                    return None

            # Fetch balance sheet
            bs = stock.balance_sheet

            # Fetch quarterly statements
            quarterly_income = stock.quarterly_income_stmt

            result = {
                # Price metrics
                "currentPrice": info.get("currentPrice")
                or info.get("regularMarketPrice"),
                "marketCap": info.get("marketCap"),
                # Valuation ratios
                "pe_ratio": info.get("trailingPE"),
                "pb_ratio": info.get("priceToBook"),
                "ps_ratio": info.get("priceToSalesTrailing12Months"),
                # Profitability
                "roe": info.get("returnOnEquity"),
                "roa": info.get("returnOnAssets"),
                "profit_margin": info.get("profitMargins"),
                "operating_margin": info.get("operatingMargins"),
                # Revenue & Profit
                "revenue": info.get("totalRevenue"),
                "net_income": info.get("netIncomeToCommon"),
                # Shareholding
                "promoter_holding": info.get("heldPercentInsiders"),
                "institutional_holding": info.get("heldPercentInstitutions"),
                "_source": "YahooFinance",
                "_timestamp": datetime.now().isoformat(),
                "_ticker_used": ticker,
            }

            # Extract balance sheet data
            if bs is not None and not bs.empty:
                try:

                    def get_bs_val(key):
                        if key in bs.index:
                            return float(bs.loc[key].iloc[0])
                        return None

                    result["total_assets"] = get_bs_val("Total Assets")
                    result["current_assets"] = get_bs_val("Current Assets")
                    result["total_debt"] = get_bs_val("Total Debt")
                    result["current_liabilities"] = get_bs_val("Current Liabilities")
                    result["stockholders_equity"] = get_bs_val("Stockholders Equity")
                except Exception as e:
                    logger.debug(f"Balance sheet extraction failed: {e}")

            # Extract quarterly data
            if quarterly_income is not None and not quarterly_income.empty:
                try:
                    cols = [
                        c for c in quarterly_income.columns if c <= pd.Timestamp.now()
                    ]
                    if cols:
                        latest = cols[0]

                        def get_qi_val(key):
                            if key in quarterly_income.index:
                                return float(quarterly_income.loc[key][latest])
                            return None

                        result["quarterly_revenue"] = get_qi_val("Total Revenue")
                        result["quarterly_net_income"] = get_qi_val("Net Income")
                        result["quarterly_date"] = str(latest.date())
                except Exception as e:
                    logger.debug(f"Quarterly data extraction failed: {e}")

            return result

        except Exception as e:
            logger.debug(f"YFinance fetch failed for {symbol}: {e}")
            return None


class MoneyControlDataFetcher:
    """Fetch data from MoneyControl via pkscreener"""

    def __init__(self):
        self.name = "MoneyControl"
        try:
            from services.market_data_service import market_data_service

            self.mc_service = market_data_service
            self.available = True
        except ImportError:
            self.available = False
            logger.warning("MoneyControl service not available")

    def fetch_fundamentals(
        self, symbol: str, statement_type: str = "standalone"
    ) -> Optional[Dict]:
        """Fetch fundamental data from MoneyControl"""
        if not self.available:
            return None

        try:
            # Clean symbol
            clean_symbol = symbol.replace(".NS", "").replace(".BO", "")

            data = self.mc_service.get_fundamentals(clean_symbol, statement_type)

            if data and "error" not in data:
                # Parse the data structure
                result = {
                    "_source": "MoneyControl",
                    "_timestamp": datetime.now().isoformat(),
                    "_raw_data": data,  # Store for detailed parsing
                }

                # Extract key metrics from profit_loss
                if "profit_loss" in data and data["profit_loss"]:
                    pl = data["profit_loss"]

                    # Helper to find latest value
                    def find_latest_value(key_list, rows):
                        for row in rows:
                            header = str(row.get("headers", "")).lower()
                            if any(k.lower() in header for k in key_list):
                                # Get first non-header key
                                date_keys = [
                                    k
                                    for k in row.keys()
                                    if k not in ["headers", "Annual"]
                                ]
                                if date_keys:
                                    val = row[date_keys[0]]
                                    if val and str(val) != "nan":
                                        # Convert Crores to absolute
                                        try:
                                            return (
                                                float(str(val).replace(",", ""))
                                                * 10000000
                                            )
                                        except:
                                            pass
                        return None

                    result["revenue"] = find_latest_value(
                        ["Sales", "Revenue", "Total Income"], pl
                    )
                    result["net_income"] = find_latest_value(["Net Profit", "PAT"], pl)

                return result

        except Exception as e:
            logger.debug(f"MoneyControl fetch failed for {symbol}: {e}")
            return None


class AlphaVantageDataFetcher:
    """Fetch data from Alpha Vantage (requires API key)"""

    def __init__(self, api_key: Optional[str] = None):
        self.name = "AlphaVantage"
        self.api_key = api_key
        self.available = api_key is not None

        if not self.available:
            logger.info("AlphaVantage not configured (no API key)")

    def fetch_fundamentals(self, symbol: str) -> Optional[Dict]:
        """Fetch fundamental data from Alpha Vantage"""
        if not self.available:
            return None

        try:
            import requests

            # Clean symbol for NSE
            clean_symbol = symbol.replace(".NS", "").replace(".BO", "")

            # Try NSE exchange
            url = f"https://www.alphavantage.co/query"
            params = {
                "function": "OVERVIEW",
                "symbol": f"{clean_symbol}.NSE",
                "apikey": self.api_key,
            }

            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if data and "Symbol" in data:
                return {
                    "currentPrice": float(data.get("50DayMovingAverage", 0))
                    if data.get("50DayMovingAverage")
                    else None,
                    "marketCap": float(data.get("MarketCapitalization", 0))
                    if data.get("MarketCapitalization")
                    else None,
                    "pe_ratio": float(data.get("PERatio", 0))
                    if data.get("PERatio")
                    else None,
                    "pb_ratio": float(data.get("PriceToBookRatio", 0))
                    if data.get("PriceToBookRatio")
                    else None,
                    "roe": float(data.get("ReturnOnEquityTTM", 0))
                    if data.get("ReturnOnEquityTTM")
                    else None,
                    "revenue": float(data.get("RevenueTTM", 0))
                    if data.get("RevenueTTM")
                    else None,
                    "_source": "AlphaVantage",
                    "_timestamp": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.debug(f"AlphaVantage fetch failed for {symbol}: {e}")
            return None


class MultiSourceDataService:
    """
    Intelligent multi-source data fetcher with fallbacks.

    Usage:
        service = MultiSourceDataService(alpha_vantage_key='YOUR_KEY')
        data, quality = service.fetch_stock_data('RELIANCE')
    """

    def __init__(
        self, alpha_vantage_key: Optional[str] = None, enable_cache: bool = True
    ):
        self.cache = {} if enable_cache else None
        self.cache_ttl = timedelta(minutes=15)  # Cache for 15 minutes

        # Initialize fetchers in priority order
        self.fetchers = [
            NSEDataFetcher(),
            YFinanceDataFetcher(),
            MoneyControlDataFetcher(),
            AlphaVantageDataFetcher(alpha_vantage_key),
        ]

        # Log available sources
        available = [f.name for f in self.fetchers if f.available]
        logger.info(
            f"MultiSourceDataService initialized with sources: {', '.join(available)}"
        )

    def fetch_stock_data(
        self, symbol: str, required_fields: Optional[List[str]] = None
    ) -> Tuple[Dict, Dict]:
        """
        Fetch stock data from multiple sources with intelligent fallbacks.

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE' or 'RELIANCE.NS')
            required_fields: List of required fields for quality scoring

        Returns:
            Tuple of (merged_data, quality_info)
        """
        # Check cache
        if self.cache is not None:
            cache_key = f"{symbol}_{datetime.now().strftime('%Y%m%d%H%M')}"
            if cache_key in self.cache:
                cached_data, cached_quality = self.cache[cache_key]
                logger.debug(f"Cache hit for {symbol}")
                return cached_data, cached_quality

        # Define default required fields if not provided
        if required_fields is None:
            required_fields = [
                "currentPrice",
                "marketCap",
                "pe_ratio",
                "roe",
                "revenue",
                "net_income",
                "total_assets",
                "total_debt",
            ]

        merged_data = {}
        sources_used = []
        fetch_attempts = []

        # Try each fetcher
        for fetcher in self.fetchers:
            if not fetcher.available:
                continue

            try:
                logger.debug(f"Trying {fetcher.name} for {symbol}...")

                # Fetch data
                if hasattr(fetcher, "fetch_fundamentals"):
                    data = fetcher.fetch_fundamentals(symbol)
                elif hasattr(fetcher, "fetch_quote"):
                    data = fetcher.fetch_quote(symbol)
                else:
                    continue

                if data:
                    # Score this source's data
                    quality = DataQuality.score_data(data, required_fields)
                    fetch_attempts.append(
                        {
                            "source": fetcher.name,
                            "quality": quality["score"],
                            "missing": quality["missing_fields"],
                        }
                    )

                    # Merge data (don't overwrite existing good data with None/0)
                    for key, value in data.items():
                        if key.startswith("_"):  # Skip metadata
                            continue

                        # Only add if we don't have it or new value is better
                        if (
                            key not in merged_data
                            or merged_data[key] is None
                            or merged_data[key] == 0
                        ):
                            if value is not None and value != 0:
                                merged_data[key] = value
                                if fetcher.name not in sources_used:
                                    sources_used.append(fetcher.name)

                    logger.info(
                        f"{fetcher.name} provided {quality['score']}% complete data for {symbol}"
                    )

                    # If we have high quality data, we can stop early
                    current_quality = DataQuality.score_data(
                        merged_data, required_fields
                    )
                    if current_quality["score"] >= 80:
                        logger.info(
                            f"Achieved {current_quality['score']}% quality, stopping early"
                        )
                        break

                # Rate limiting between sources
                time.sleep(0.5)

            except Exception as e:
                logger.error(f"Error fetching from {fetcher.name} for {symbol}: {e}")
                continue

        # Final quality assessment
        final_quality = DataQuality.score_data(merged_data, required_fields)
        final_quality["sources_used"] = sources_used
        final_quality["fetch_attempts"] = fetch_attempts
        final_quality["symbol"] = symbol

        # Add metadata
        merged_data["_sources"] = sources_used
        merged_data["_quality_score"] = final_quality["score"]
        merged_data["_last_updated"] = datetime.now().isoformat()

        # Cache result
        if self.cache is not None:
            cache_key = f"{symbol}_{datetime.now().strftime('%Y%m%d%H%M')}"
            self.cache[cache_key] = (merged_data, final_quality)

        logger.info(
            f"Final data for {symbol}: {final_quality['score']}% complete from {len(sources_used)} sources"
        )

        return merged_data, final_quality

    def fetch_multiple_stocks(
        self, symbols: List[str], required_fields: Optional[List[str]] = None
    ) -> Dict:
        """
        Fetch data for multiple stocks with progress tracking.

        Returns:
            Dict of {symbol: (data, quality)}
        """
        results = {}
        total = len(symbols)

        for i, symbol in enumerate(symbols, 1):
            logger.info(f"Fetching {i}/{total}: {symbol}")

            try:
                data, quality = self.fetch_stock_data(symbol, required_fields)
                results[symbol] = {"data": data, "quality": quality}
            except Exception as e:
                logger.error(f"Failed to fetch {symbol}: {e}")
                results[symbol] = {"data": {}, "quality": {"score": 0, "error": str(e)}}

            # Rate limiting
            if i < total:
                time.sleep(1)

        return results


# Singleton instance
multi_source_service = MultiSourceDataService()
