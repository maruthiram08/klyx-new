"""
Stock Database Populator - Fetches and populates NSE/BSE stock data.

Uses multiple sources to get comprehensive Indian stock market data:
1. NSE official list (via nsepython or web scraping)
2. BSE official list
3. Multi-source data service for fundamentals

For Vercel deployment, this can be triggered via API or cron job.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime
from typing import Dict, List, Optional

import pandas as pd
from database.db_config import db_config
from services.multi_source_data_service import multi_source_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StockListFetcher:
    """Fetch list of all NSE/BSE stocks"""

    @staticmethod
    def get_nse_stock_list() -> List[Dict]:
        """
        Get list of all NSE stocks.
        Returns list of dicts with: {name, symbol, industry, sector}
        """
        try:
            # Method 1: Try nsepython
            try:
                from nsepython import nse_eq_symbols

                symbols = nse_eq_symbols()

                stocks = []
                for symbol in symbols[:100]:  # Start with top 100 for testing
                    stocks.append(
                        {"name": symbol, "nse_code": symbol, "exchange": "NSE"}
                    )

                logger.info(f"Fetched {len(stocks)} NSE stocks via nsepython")
                return stocks
            except ImportError:
                logger.warning("nsepython not available, using fallback")

        except Exception as e:
            logger.error(f"Error fetching NSE list: {e}")

        # Method 2: Use hardcoded Nifty 50 + Nifty Next 50 as fallback
        return StockListFetcher._get_nifty_stocks()

    @staticmethod
    def _get_nifty_stocks() -> List[Dict]:
        """Fallback: Get Nifty 50 + Next 50 stocks"""
        # Nifty 50 stocks
        nifty_50 = [
            {
                "name": "Reliance Industries Ltd.",
                "nse_code": "RELIANCE",
                "sector": "Energy",
            },
            {
                "name": "Tata Consultancy Services Ltd.",
                "nse_code": "TCS",
                "sector": "IT",
            },
            {
                "name": "HDFC Bank Ltd.",
                "nse_code": "HDFCBANK",
                "sector": "Financial Services",
            },
            {"name": "Infosys Ltd.", "nse_code": "INFY", "sector": "IT"},
            {
                "name": "ICICI Bank Ltd.",
                "nse_code": "ICICIBANK",
                "sector": "Financial Services",
            },
            {
                "name": "Hindustan Unilever Ltd.",
                "nse_code": "HINDUNILVR",
                "sector": "FMCG",
            },
            {"name": "ITC Ltd.", "nse_code": "ITC", "sector": "FMCG"},
            {
                "name": "State Bank of India",
                "nse_code": "SBIN",
                "sector": "Financial Services",
            },
            {
                "name": "Bharti Airtel Ltd.",
                "nse_code": "BHARTIARTL",
                "sector": "Telecom",
            },
            {
                "name": "Kotak Mahindra Bank Ltd.",
                "nse_code": "KOTAKBANK",
                "sector": "Financial Services",
            },
            {
                "name": "Axis Bank Ltd.",
                "nse_code": "AXISBANK",
                "sector": "Financial Services",
            },
            {
                "name": "Larsen & Toubro Ltd.",
                "nse_code": "LT",
                "sector": "Construction",
            },
            {
                "name": "Asian Paints Ltd.",
                "nse_code": "ASIANPAINT",
                "sector": "Consumer Durables",
            },
            {
                "name": "Maruti Suzuki India Ltd.",
                "nse_code": "MARUTI",
                "sector": "Automobile",
            },
            {"name": "HCL Technologies Ltd.", "nse_code": "HCLTECH", "sector": "IT"},
            {
                "name": "Bajaj Finance Ltd.",
                "nse_code": "BAJFINANCE",
                "sector": "Financial Services",
            },
            {
                "name": "Mahindra & Mahindra Ltd.",
                "nse_code": "M&M",
                "sector": "Automobile",
            },
            {
                "name": "Sun Pharmaceutical Industries Ltd.",
                "nse_code": "SUNPHARMA",
                "sector": "Pharma",
            },
            {
                "name": "Titan Company Ltd.",
                "nse_code": "TITAN",
                "sector": "Consumer Durables",
            },
            {
                "name": "Adani Ports and Special Economic Zone Ltd.",
                "nse_code": "ADANIPORTS",
                "sector": "Infrastructure",
            },
            {
                "name": "UltraTech Cement Ltd.",
                "nse_code": "ULTRACEMCO",
                "sector": "Cement",
            },
            {"name": "Wipro Ltd.", "nse_code": "WIPRO", "sector": "IT"},
            {"name": "Nestle India Ltd.", "nse_code": "NESTLEIND", "sector": "FMCG"},
            {
                "name": "Power Grid Corporation of India Ltd.",
                "nse_code": "POWERGRID",
                "sector": "Power",
            },
            {"name": "Tata Steel Ltd.", "nse_code": "TATASTEEL", "sector": "Metals"},
            {
                "name": "Bajaj Finserv Ltd.",
                "nse_code": "BAJAJFINSV",
                "sector": "Financial Services",
            },
            {"name": "Tech Mahindra Ltd.", "nse_code": "TECHM", "sector": "IT"},
            {
                "name": "Adani Enterprises Ltd.",
                "nse_code": "ADANIENT",
                "sector": "Diversified",
            },
            {"name": "NTPC Ltd.", "nse_code": "NTPC", "sector": "Power"},
            {"name": "Coal India Ltd.", "nse_code": "COALINDIA", "sector": "Mining"},
            {"name": "JSW Steel Ltd.", "nse_code": "JSWSTEEL", "sector": "Metals"},
            {"name": "Cipla Ltd.", "nse_code": "CIPLA", "sector": "Pharma"},
            {
                "name": "Tata Motors Ltd.",
                "nse_code": "TATAMOTORS",
                "sector": "Automobile",
            },
            {
                "name": "Hero MotoCorp Ltd.",
                "nse_code": "HEROMOTOCO",
                "sector": "Automobile",
            },
            {
                "name": "Eicher Motors Ltd.",
                "nse_code": "EICHERMOT",
                "sector": "Automobile",
            },
            {
                "name": "Grasim Industries Ltd.",
                "nse_code": "GRASIM",
                "sector": "Cement",
            },
            {
                "name": "Apollo Hospitals Enterprise Ltd.",
                "nse_code": "APOLLOHOSP",
                "sector": "Healthcare",
            },
            {
                "name": "Britannia Industries Ltd.",
                "nse_code": "BRITANNIA",
                "sector": "FMCG",
            },
            {
                "name": "SBI Life Insurance Company Ltd.",
                "nse_code": "SBILIFE",
                "sector": "Financial Services",
            },
            {
                "name": "Dr. Reddys Laboratories Ltd.",
                "nse_code": "DRREDDY",
                "sector": "Pharma",
            },
            {
                "name": "Hindalco Industries Ltd.",
                "nse_code": "HINDALCO",
                "sector": "Metals",
            },
            {
                "name": "Bharat Petroleum Corporation Ltd.",
                "nse_code": "BPCL",
                "sector": "Energy",
            },
            {
                "name": "IndusInd Bank Ltd.",
                "nse_code": "INDUSINDBK",
                "sector": "Financial Services",
            },
            {
                "name": "Divi's Laboratories Ltd.",
                "nse_code": "DIVISLAB",
                "sector": "Pharma",
            },
            {
                "name": "HDFC Life Insurance Company Ltd.",
                "nse_code": "HDFCLIFE",
                "sector": "Financial Services",
            },
            {"name": "Shree Cement Ltd.", "nse_code": "SHREECEM", "sector": "Cement"},
            {
                "name": "Indian Oil Corporation Ltd.",
                "nse_code": "IOC",
                "sector": "Energy",
            },
            {
                "name": "Bajaj Auto Ltd.",
                "nse_code": "BAJAJ-AUTO",
                "sector": "Automobile",
            },
            {
                "name": "Tata Consumer Products Ltd.",
                "nse_code": "TATACONSUM",
                "sector": "FMCG",
            },
            {"name": "ONGC Ltd.", "nse_code": "ONGC", "sector": "Energy"},
        ]

        logger.info(f"Using Nifty 50 fallback list: {len(nifty_50)} stocks")
        return nifty_50


class StockDataPopulator:
    """Populate database with stock data"""

    def __init__(self):
        self.db = db_config

    def populate_initial_stocks(self, stock_list: List[Dict]) -> Dict:
        """
        Populate database with initial stock list (without full data).
        This is fast and creates placeholders.
        """
        logger.info(f"Populating {len(stock_list)} stocks into database...")

        inserted = 0
        updated = 0
        failed = 0

        for stock in stock_list:
            try:
                # Check if stock exists
                existing = self.db.execute_query(
                    "SELECT id FROM stocks WHERE nse_code = ?",
                    (stock["nse_code"],),
                    fetch_one=True,
                )

                if existing:
                    # Update basic info
                    self.db.execute_query(
                        """UPDATE stocks SET
                           stock_name = ?,
                           sector_name = ?,
                           last_updated = datetime('now')
                           WHERE nse_code = ?""",
                        (stock.get("name"), stock.get("sector"), stock["nse_code"]),
                    )
                    updated += 1
                else:
                    # Insert new stock
                    self.db.execute_query(
                        """INSERT INTO stocks (stock_name, nse_code, sector_name, data_quality_score)
                           VALUES (?, ?, ?, 0)""",
                        (stock.get("name"), stock["nse_code"], stock.get("sector")),
                    )
                    inserted += 1

            except Exception as e:
                logger.error(f"Failed to insert {stock.get('nse_code')}: {e}")
                failed += 1

        logger.info(
            f"✅ Stock list populated: {inserted} inserted, {updated} updated, {failed} failed"
        )

        return {
            "inserted": inserted,
            "updated": updated,
            "failed": failed,
            "total": len(stock_list),
        }

    def enrich_stock_data(
        self, batch_size: int = 10, max_stocks: Optional[int] = None
    ) -> Dict:
        """
        Enrich stocks with full fundamental data using multi-source service.
        This is slow but comprehensive.
        """
        logger.info("Starting stock data enrichment...")

        # Get stocks that need enrichment (low quality score or old data)
        query = """
            SELECT id, stock_name, nse_code
            FROM stocks
            WHERE data_quality_score < 80
               OR last_updated < datetime('now', '-7 days')
            ORDER BY market_cap DESC NULLS LAST
        """

        if max_stocks:
            query += f" LIMIT {max_stocks}"

        stocks_to_enrich = self.db.execute_query(query)

        if not stocks_to_enrich:
            logger.info("No stocks need enrichment")
            return {"enriched": 0, "failed": 0}

        logger.info(f"Enriching {len(stocks_to_enrich)} stocks...")

        enriched = 0
        failed = 0

        for i, stock in enumerate(stocks_to_enrich, 1):
            try:
                logger.info(
                    f"[{i}/{len(stocks_to_enrich)}] Enriching {stock['nse_code']}..."
                )

                # Fetch data from multi-source service
                data, quality = multi_source_service.fetch_stock_data(
                    stock["nse_code"],
                    required_fields=[
                        "currentPrice",
                        "marketCap",
                        "pe_ratio",
                        "roe",
                        "revenue",
                        "net_income",
                        "total_assets",
                        "total_debt",
                    ],
                )

                if data and quality["score"] > 0:
                    # Update database with enriched data
                    self._update_stock_data(stock["id"], data, quality)
                    enriched += 1
                    logger.info(f"  ✓ Quality: {quality['score']}%")
                else:
                    failed += 1
                    logger.warning(f"  ✗ No data fetched")

                # Rate limiting
                if i % batch_size == 0:
                    logger.info(f"Batch {i // batch_size} complete. Pausing...")
                    import time

                    time.sleep(2)

            except Exception as e:
                logger.error(f"Failed to enrich {stock['nse_code']}: {e}")
                failed += 1

        logger.info(f"✅ Enrichment complete: {enriched} enriched, {failed} failed")

        return {"enriched": enriched, "failed": failed, "total": len(stocks_to_enrich)}

    def _update_stock_data(self, stock_id: int, data: Dict, quality: Dict):
        """Update stock with enriched data"""

        # Calculate derived ratios
        debt_to_equity = None
        current_ratio = None

        if data.get("total_debt") and data.get("stockholders_equity"):
            debt_to_equity = data["total_debt"] / data["stockholders_equity"]

        if data.get("current_assets") and data.get("current_liabilities"):
            current_ratio = data["current_assets"] / data["current_liabilities"]

        update_query = """
            UPDATE stocks SET
                current_price = ?,
                market_cap = ?,
                pe_ttm = ?,
                pb_ratio = ?,
                roe_annual_pct = ?,
                roa_annual_pct = ?,
                operating_margin_pct = ?,
                revenue_growth_yoy_pct = ?,
                revenue_annual = ?,
                net_profit_annual = ?,
                debt_to_equity = ?,
                current_ratio = ?,
                dividend_yield_pct = ?,
                promoter_holding_pct = ?,
                data_quality_score = ?,
                data_sources = ?,
                last_updated = datetime('now')
            WHERE id = ?
        """

        params = (
            data.get("currentPrice"),
            data.get("marketCap"),
            data.get("pe_ratio"),
            data.get("pb_ratio"),
            data.get("roe") * 100 if data.get("roe") else None,
            data.get("roa") * 100 if data.get("roa") else None,
            data.get("operating_margin") * 100
            if data.get("operating_margin")
            else None,
            data.get("revenue_growth") * 100 if data.get("revenue_growth") else None,
            data.get("revenue"),
            data.get("net_income"),
            debt_to_equity,
            current_ratio,
            data.get("dividend_yield") * 100 if data.get("dividend_yield") else None,
            data.get("promoter_holding") * 100
            if data.get("promoter_holding")
            else None,
            quality["score"],
            ", ".join(quality.get("sources_used", [])),
            stock_id,
        )

        self.db.execute_query(update_query, params)

    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        stats = {}

        # Total stocks
        result = self.db.execute_query(
            "SELECT COUNT(*) as count FROM stocks", fetch_one=True
        )
        stats["total_stocks"] = result["count"] if result else 0

        # High quality stocks
        result = self.db.execute_query(
            "SELECT COUNT(*) as count FROM stocks WHERE data_quality_score >= 80",
            fetch_one=True,
        )
        stats["high_quality_stocks"] = result["count"] if result else 0

        # Average quality
        result = self.db.execute_query(
            "SELECT AVG(data_quality_score) as avg FROM stocks WHERE data_quality_score > 0",
            fetch_one=True,
        )
        stats["avg_quality"] = (
            round(result["avg"], 1) if result and result["avg"] else 0
        )

        # Last update
        result = self.db.execute_query(
            "SELECT MAX(last_updated) as last_update FROM stocks", fetch_one=True
        )
        stats["last_updated"] = result["last_update"] if result else None

        return stats


def main():
    """Main execution"""
    print("=" * 70)
    print("Stock Database Populator")
    print("=" * 70)

    # Initialize database
    print("\n1. Initializing database...")
    db_config.init_database()

    # Fetch stock list
    print("\n2. Fetching NSE stock list...")
    stock_list = StockListFetcher.get_nse_stock_list()
    print(f"   Found {len(stock_list)} stocks")

    # Populate stocks
    print("\n3. Populating stock list...")
    populator = StockDataPopulator()
    result = populator.populate_initial_stocks(stock_list)
    print(f"   ✓ Inserted: {result['inserted']}, Updated: {result['updated']}")

    # Enrich stocks (start with small batch for testing)
    print("\n4. Enriching stock data (first 5 stocks)...")
    enrich_result = populator.enrich_stock_data(max_stocks=5)
    print(
        f"   ✓ Enriched: {enrich_result['enriched']}, Failed: {enrich_result['failed']}"
    )

    # Show stats
    print("\n5. Database Statistics:")
    stats = populator.get_database_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")

    print("\n" + "=" * 70)
    print("✅ Database population complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
