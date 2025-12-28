"""
Render.com Worker App - Long-Running Tasks
Handles: Stock enrichment, database population, scheduled refresh
Does NOT handle: User API requests (see Vercel serverless)
"""

import logging
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS - allow Vercel API to trigger jobs
allowed_origins = [
    os.environ.get("VERCEL_API_URL", "https://klyx.vercel.app"),
    "http://localhost:3000",
    "http://localhost:5001",
]
CORS(app, origins=allowed_origins)


@app.route("/health")
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "render-worker", "version": "1.0.0"})


@app.route("/")
def root():
    """Root endpoint"""
    return jsonify(
        {
            "message": "Klyx Background Worker",
            "status": "running",
            "endpoints": {
                "health": "/health",
                "migrate": "/worker/migrate (POST)",
                "enrich": "/worker/enrich (POST)",
                "populate": "/worker/populate (POST)",
                "refresh": "/worker/refresh (POST)",
                "sync-fundamentals": "/worker/sync-fundamentals (POST)",
            },
        }
    )


@app.route("/worker/migrate", methods=["POST"])
def run_migrations():
    """
    Run database migrations to add new columns
    Safe to run multiple times (uses IF NOT EXISTS)
    """
    try:
        from database.db_config import db_config
        
        migrations = [
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS durability_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS valuation_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS momentum_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS roce_annual_pct DECIMAL(10,2)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS earnings_yield_pct DECIMAL(10,2)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS rel_strength_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS recommendation_key VARCHAR(50)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS analyst_count INTEGER",
        ]
        
        logger.info("Running database migrations...")
        results = []
        
        for i, migration in enumerate(migrations, 1):
            try:
                db_config.execute_query(migration)
                logger.info(f"✅ Migration {i}/{len(migrations)}: {migration[:60]}...")
                results.append({"migration": i, "status": "success", "sql": migration[:60]})
            except Exception as e:
                logger.warning(f"⚠️  Migration {i} failed (may already exist): {e}")
                results.append({"migration": i, "status": "skipped", "reason": str(e)[:100]})
        
        logger.info("✅ All migrations complete!")
        
        return jsonify({
            "status": "success",
            "message": "Database migrations completed",
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/worker/enrich", methods=["POST"])
def enrich_stocks():
    """
    Enrich stocks with sector, industry, day_change_pct
    Can take 20-30 minutes for all stocks
    """
    try:
        # Import here to avoid issues if module not found
        from database.stock_populator import StockDataPopulator

        # Get parameters from request
        data = request.json or {}
        batch_size = data.get("batch_size", 50)
        max_stocks = data.get("max_stocks", None) # Optional limit

        logger.info(f"Starting enrichment: batch_size={batch_size}")

        # Run enrichment
        populator = StockDataPopulator()
        result = populator.enrich_stock_data(batch_size=batch_size, max_stocks=max_stocks)

        logger.info(f"Enrichment complete: {result}")

        return jsonify(
            {
                "status": "success",
                "message": "Stock enrichment completed",
                "data": result,
            }
        )

    except Exception as e:
        logger.error(f"Enrichment failed: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/worker/populate", methods=["POST"])
def populate_database():
    """
    Populate database with stock metadata
    Can take 15-30 minutes
    """
    try:
        from database.stock_populator import StockDataPopulator, StockListFetcher

        logger.info("Starting database population")
        
        # 1. Fetch latest list
        stock_list = StockListFetcher.get_nse_stock_list()
        
        # 2. Populate/Update initial records
        populator = StockDataPopulator()
        result = populator.populate_initial_stocks(stock_list)

        logger.info(f"Population complete: {result}")

        return jsonify(
            {
                "status": "success",
                "message": "Database population completed",
                "data": result,
            }
        )

    except Exception as e:
        logger.error(f"Population failed: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/worker/refresh", methods=["POST"])
def refresh_stock_data():
    """
    Refresh stock data (daily prices, etc.)
    Faster than full enrichment
    """
    try:
        from database.enrich_missing_fields import refresh_daily_prices

        logger.info("Starting daily refresh")

        result = refresh_daily_prices()

        logger.info(f"Refresh complete: {result}")

        return jsonify(
            {"status": "success", "message": "Daily refresh completed", "data": result}
        )

    except Exception as e:
        logger.error(f"Refresh failed: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/worker/sync-fundamentals", methods=["POST"])
def sync_fundamentals():
    """
    Sync fundamental data from MoneyControl for all stocks.
    Updates: P&L, Balance Sheet, Cash Flow, Ratios
    Can take 30-60 minutes for all stocks.
    """
    try:
        import time
        from database.db_config import DatabaseConfig
        from services.market_data_service import market_data_service

        db_config = DatabaseConfig()
        
        # Get parameters
        data = request.json or {}
        batch_size = data.get("batch_size", 50)
        offset = data.get("offset", 0)

        logger.info(f"Starting MoneyControl fundamentals sync: batch_size={batch_size}, offset={offset}")

        # Get stocks to sync
        query = f"""
            SELECT nse_code, stock_name 
            FROM stocks 
            ORDER BY market_cap DESC NULLS LAST
            LIMIT %s OFFSET %s
        """
        stocks = db_config.execute_query(query, (batch_size, offset))

        if not stocks:
            return jsonify({
                "status": "success",
                "message": "No stocks to sync",
                "data": {"synced": 0, "failed": 0}
            })

        synced = 0
        failed = 0
        results = []

        for stock in stocks:
            nse_code = stock["nse_code"]
            try:
                logger.info(f"Fetching fundamentals for {nse_code}...")
                
                # Fetch fundamentals from MoneyControl
                fundamentals = market_data_service.get_fundamentals(nse_code)
                
                if "error" not in fundamentals:
                    synced += 1
                    results.append({"stock": nse_code, "status": "success"})
                    logger.info(f"✅ Synced {nse_code}")
                else:
                    failed += 1
                    results.append({"stock": nse_code, "status": "failed", "error": fundamentals.get("error")})
                    logger.warning(f"⚠️ Failed to sync {nse_code}: {fundamentals.get('error')}")

                # Rate limiting - don't hammer MoneyControl
                time.sleep(2)

            except Exception as e:
                failed += 1
                results.append({"stock": nse_code, "status": "error", "error": str(e)})
                logger.error(f"❌ Error syncing {nse_code}: {e}")

        logger.info(f"Fundamentals sync complete: {synced} synced, {failed} failed")

        return jsonify({
            "status": "success",
            "message": f"Fundamentals sync completed: {synced} synced, {failed} failed",
            "data": {
                "synced": synced,
                "failed": failed,
                "batch_size": batch_size,
                "offset": offset,
                "details": results[:10]  # Only return first 10 for brevity
            }
        })

    except Exception as e:
        logger.error(f"Fundamentals sync failed: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/worker/trigger/<task>", methods=["POST"])
def trigger_task(task):
    """
    Manual task trigger (requires API key)
    Tasks: enrich, populate, refresh
    """
    # Check API key
    api_key = request.headers.get("X-API-Key")
    expected_key = os.environ.get("WORKER_API_KEY")

    if not api_key or api_key != expected_key:
        logger.warning(f"Unauthorized trigger attempt for task: {task}")
        return jsonify(
            {"status": "error", "message": "Unauthorized - Invalid API key"}
        ), 401

    # Route to appropriate handler
    if task == "enrich":
        return enrich_stocks()
    elif task == "populate":
        return populate_database()
    elif task == "refresh":
        return refresh_stock_data()
    else:
        return jsonify({"status": "error", "message": f"Unknown task: {task}"}), 400


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}", exc_info=True)
    return jsonify({"status": "error", "message": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    debug = os.environ.get("FLASK_ENV") != "production"

    logger.info(f"Starting worker app on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
