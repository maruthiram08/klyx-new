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
                "enrich": "/worker/enrich (POST)",
                "populate": "/worker/populate (POST)",
                "refresh": "/worker/refresh (POST)",
            },
        }
    )


@app.route("/worker/enrich", methods=["POST"])
def enrich_stocks():
    """
    Enrich stocks with sector, industry, day_change_pct
    Can take 20-30 minutes for all stocks
    """
    try:
        # Import here to avoid issues if module not found
        from database.enrich_missing_fields import enrich_all_stocks

        # Get parameters from request
        data = request.json or {}
        batch_size = data.get("batch_size", 50)
        offset = data.get("offset", 0)

        logger.info(f"Starting enrichment: batch_size={batch_size}, offset={offset}")

        # Run enrichment
        result = enrich_all_stocks(batch_size=batch_size, offset=offset)

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
        from database.stock_populator import populate_stocks

        logger.info("Starting database population")

        result = populate_stocks()

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
