"""
Enrich database with missing sector_name and day_change_pct fields.
Uses yfinance to fetch sector and price data for stocks.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import time
from typing import Dict, Optional

import yfinance as yf
from database.db_config import db_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_sector_and_price_change(nse_code: str) -> Optional[Dict]:
    """
    Fetch sector and day change % from yfinance.

    Args:
        nse_code: NSE stock code (e.g., 'RELIANCE')

    Returns:
        Dict with sector_name and day_change_pct, or None if fetch fails
    """
    try:
        # Try with .NS suffix first (NSE)
        ticker = yf.Ticker(f"{nse_code}.NS")
        info = ticker.info

        # Check if we got valid data
        if not info or "sector" not in info:
            logger.warning(f"No data found for {nse_code}")
            return None

        # Extract sector
        sector = info.get("sector")

        # Calculate day change %
        current_price = info.get("currentPrice")
        prev_close = info.get("previousClose")

        day_change_pct = None
        if current_price and prev_close and prev_close > 0:
            day_change_pct = ((current_price - prev_close) / prev_close) * 100

        return {
            "sector_name": sector,
            "day_change_pct": day_change_pct,
            "industry_name": info.get("industry"),
        }

    except Exception as e:
        logger.error(f"Error fetching data for {nse_code}: {e}")
        return None


def enrich_database():
    """
    Update database with missing sector and day_change_pct fields.
    """
    logger.info("Starting database enrichment...")

    # Get all stocks with missing sector or day_change_pct
    query = """
        SELECT id, nse_code, stock_name, sector_name, day_change_pct
        FROM stocks
        WHERE sector_name IS NULL OR day_change_pct IS NULL
        ORDER BY id
    """

    stocks = db_config.execute_query(query)

    if not stocks:
        logger.info("No stocks need enrichment!")
        return

    logger.info(f"Found {len(stocks)} stocks to enrich")

    updated = 0
    failed = 0

    for stock in stocks:
        nse_code = stock["nse_code"]
        stock_id = stock["id"]

        logger.info(f"Processing {nse_code} ({stock['stock_name']})...")

        # Fetch data
        data = fetch_sector_and_price_change(nse_code)

        if data:
            # Update database
            update_query = """
                UPDATE stocks
                SET sector_name = ?,
                    industry_name = ?,
                    day_change_pct = ?,
                    last_updated = datetime('now')
                WHERE id = ?
            """

            try:
                db_config.execute_query(
                    update_query,
                    (
                        data.get("sector_name"),
                        data.get("industry_name"),
                        data.get("day_change_pct"),
                        stock_id,
                    ),
                )
                updated += 1
                logger.info(
                    f"✅ Updated {nse_code}: Sector={data.get('sector_name')}, Change={data.get('day_change_pct'):.2f}%"
                    if data.get("day_change_pct")
                    else f"✅ Updated {nse_code}: Sector={data.get('sector_name')}"
                )
            except Exception as e:
                logger.error(f"❌ Failed to update {nse_code}: {e}")
                failed += 1
        else:
            failed += 1

        # Rate limiting - don't hammer yfinance API
        time.sleep(0.5)

    logger.info(f"""
    =====================================
    Enrichment Complete!
    =====================================
    Updated: {updated}
    Failed: {failed}
    Total: {len(stocks)}
    =====================================
    """)


if __name__ == "__main__":
    enrich_database()
