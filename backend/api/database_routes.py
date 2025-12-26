"""
Database Management API Routes for Stock Database.

These endpoints allow:
- Initializing the database
- Populating stock list
- Enriching stock data
- Viewing database statistics
- Manual refresh triggers
"""

import os
import sys
from datetime import datetime

from flask import Blueprint, jsonify, request

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging

from database.db_config import db_config
from database.stock_populator import StockDataPopulator, StockListFetcher
from services.screener_db_service import db_screener

logger = logging.getLogger(__name__)

# Create blueprint
db_routes = Blueprint("database", __name__, url_prefix="/api/database")


@db_routes.route("/init", methods=["POST"])
def init_database():
    """Initialize database with schema"""
    try:
        success = db_config.init_database()

        if success:
            return jsonify(
                {"status": "success", "message": "Database initialized successfully"}
            )
        else:
            return jsonify(
                {"status": "error", "message": "Database initialization failed"}
            ), 500

    except Exception as e:
        logger.error(f"Database init error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/populate", methods=["POST"])
def populate_stocks():
    """
    Populate database with stock list.

    Query params:
        - exchange: 'NSE' or 'BSE' (default: NSE)
    """
    try:
        exchange = request.args.get("exchange", "NSE")

        # Fetch stock list
        logger.info(f"Fetching {exchange} stock list...")

        if exchange == "NSE":
            stock_list = StockListFetcher.get_nse_stock_list()
        else:
            return jsonify(
                {"status": "error", "message": f"Exchange {exchange} not yet supported"}
            ), 400

        # Populate database
        populator = StockDataPopulator()
        result = populator.populate_initial_stocks(stock_list)

        return jsonify(
            {
                "status": "success",
                "message": f"Populated {result['inserted']} stocks",
                "data": result,
            }
        )

    except Exception as e:
        logger.error(f"Population error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/enrich", methods=["POST"])
def enrich_stocks():
    """
    Enrich stocks with fundamental data.

    JSON body:
        - batch_size: Number of stocks per batch (default: 10)
        - max_stocks: Maximum stocks to enrich (default: None = all)
    """
    try:
        data = request.json or {}
        batch_size = data.get("batch_size", 10)
        max_stocks = data.get("max_stocks")

        populator = StockDataPopulator()
        result = populator.enrich_stock_data(
            batch_size=batch_size, max_stocks=max_stocks
        )

        return jsonify(
            {
                "status": "success",
                "message": f"Enriched {result['enriched']} stocks",
                "data": result,
            }
        )

    except Exception as e:
        logger.error(f"Enrichment error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/stats", methods=["GET"])
def get_database_stats():
    """Get database statistics"""
    try:
        populator = StockDataPopulator()
        stats = populator.get_database_stats()

        return jsonify({"status": "success", "data": stats})

    except Exception as e:
        logger.error(f"Stats error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/stocks", methods=["GET"])
def list_stocks():
    """
    List stocks with pagination.

    Query params:
        - limit: Number of stocks (default: 50)
        - offset: Offset for pagination (default: 0)
        - sector: Filter by sector
        - min_quality: Minimum quality score (default: 30)
        - search: Search by NSE code or stock name
    """
    try:
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))
        sector = request.args.get("sector")
        min_quality = int(request.args.get("min_quality", 30))
        search = request.args.get("search")

        # Build query
        where_clauses = [f"data_quality_score >= {min_quality}"]
        params = []

        if sector:
            where_clauses.append("sector_name = ?")
            params.append(sector)

        if search:
            where_clauses.append("(nse_code = ? OR stock_name LIKE ?)")
            params.append(search)
            params.append(f"%{search}%")

        where_clause = " AND ".join(where_clauses)

        query = f"""
            SELECT id, stock_name, nse_code, sector_name, current_price,
                   day_change_pct, market_cap, pe_ttm, roe_annual_pct, data_quality_score,
                   last_updated
            FROM stocks
            WHERE {where_clause}
            ORDER BY market_cap DESC NULLS LAST
            LIMIT ? OFFSET ?
        """

        params.extend([limit, offset])

        stocks = db_config.execute_query(query, tuple(params))

        # Get total count
        count_query = f"SELECT COUNT(*) as count FROM stocks WHERE {where_clause}"
        count_result = db_config.execute_query(
            count_query, tuple(params[:-2]), fetch_one=True
        )
        total = count_result["count"] if count_result else 0

        return jsonify(
            {
                "status": "success",
                "data": stocks,
                "pagination": {
                    "limit": limit,
                    "offset": offset,
                    "total": total,
                    "has_more": (offset + limit) < total,
                },
            }
        )

    except Exception as e:
        logger.error(f"List stocks error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/stocks/<nse_code>", methods=["GET"])
def get_stock_details(nse_code: str):
    """Get detailed stock information"""
    try:
        query = "SELECT * FROM stocks WHERE nse_code = ?"
        stock = db_config.execute_query(query, (nse_code,), fetch_one=True)

        if not stock:
            return jsonify(
                {"status": "error", "message": f"Stock {nse_code} not found"}
            ), 404

        # Lazy Loading Logic: Check if data is stale (> 15 mins) during market hours
        should_update = False
        last_updated_str = stock.get("last_updated")

        if not last_updated_str:
            should_update = True
        else:
            try:
                # Convert string to datetime
                last_updated = datetime.strptime(last_updated_str, "%Y-%m-%d %H:%M:%S")

                # Check if older than 15 mins
                if (datetime.now() - last_updated).total_seconds() > 900:  # 15 mins
                    should_update = True
            except:
                should_update = True  # Parse error, assume stale

        if should_update:
            # Trigger quick update logic
            try:
                from database.stock_populator import StockDataPopulator
                from services.multi_source_data_service import multi_source_service

                logger.info(f"🔄 Lazy loading: Fetching fresh data for {nse_code}...")

                # Fetch fresh data
                data, quality = multi_source_service.fetch_stock_data(
                    nse_code,
                    required_fields=[
                        "currentPrice",
                        "dayChange",
                        "marketCap",
                        "pe_ratio",
                    ],
                )

                if data and quality["score"] > 0:
                    # Update DB
                    populator = StockDataPopulator()
                    # We reuse _update_stock_data but minimal fields might wipe others if not careful?
                    # valid point. _update_stock_data expects full dictionary or might overwrite with None.
                    # Looking at _update_stock_data implementation:
                    # It uses data.get(...) so if keys are missing it inserts None.
                    # This is risky if we only fetch partial data.
                    # We should probably use a safer update or fetch full data.
                    # Let's fetch FULL data for the lazy load to be safe and comprehensive.

                    # Re-fetch full data actually (default behavior of fetch_stock_data without required_fields)
                    full_data, full_quality = multi_source_service.fetch_stock_data(
                        nse_code
                    )

                    if full_data and full_quality["score"] > 0:
                        populator._update_stock_data(
                            stock["id"], full_data, full_quality
                        )

                        # Re-fetch stock from DB to return updated version
                        stock = db_config.execute_query(
                            query, (nse_code,), fetch_one=True
                        )
                        logger.info(f"✅ Lazy load success for {nse_code}")

            except Exception as lazy_e:
                logger.error(f"Lazy load failed for {nse_code}: {lazy_e}")
                # We continue to return old data explicitly if update fails

        return jsonify({"status": "success", "data": stock})

    except Exception as e:
        logger.error(f"Get stock error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/refresh", methods=["POST"])
def refresh_database():
    """
    Full database refresh - populate + enrich.
    This can be triggered by a cron job or manually.

    JSON body:
        - full: If true, refresh all stocks. If false, only update stale data.
    """
    try:
        data = request.json or {}
        full_refresh = data.get("full", False)

        populator = StockDataPopulator()
        results = {}

        # Step 1: Update stock list
        logger.info("Refreshing stock list...")
        stock_list = StockListFetcher.get_nse_stock_list()
        pop_result = populator.populate_initial_stocks(stock_list)
        results["populate"] = pop_result

        # Step 2: Enrich stocks
        logger.info("Enriching stock data...")
        max_stocks = None if full_refresh else 50  # Limit to 50 for incremental
        enrich_result = populator.enrich_stock_data(max_stocks=max_stocks)
        results["enrich"] = enrich_result

        # Step 3: Get updated stats
        stats = populator.get_database_stats()
        results["stats"] = stats

        return jsonify(
            {
                "status": "success",
                "message": "Database refreshed successfully",
                "data": results,
            }
        )

    except Exception as e:
        logger.error(f"Refresh error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@db_routes.route("/sectors", methods=["GET"])
def get_sectors():
    """Get list of all sectors with stock counts"""
    try:
        query = """
            SELECT sector_name, COUNT(*) as stock_count
            FROM stocks
            WHERE sector_name IS NOT NULL
            GROUP BY sector_name
            ORDER BY stock_count DESC
        """

        sectors = db_config.execute_query(query)

        return jsonify({"status": "success", "data": sectors})

    except Exception as e:
        logger.error(f"Get sectors error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
