import json
import os
import sys
import threading

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# Also allow importing from current directory if needed
sys.path.append("/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend")

import clean_data
import enrich_data
import generate_insights

app = Flask(__name__)
# Enable CORS for all routes (Next.js is on localhost:3000)
# Enable CORS for Next.js frontend
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
)

# Path to datasource (relative to backend/)
app.config["UPLOAD_FOLDER"] = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "datasource"
)
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Register database management routes
try:
    from api.database_routes import db_routes

    app.register_blueprint(db_routes)
    print("✓ Database routes registered")
except Exception as e:
    print(f"⚠ Database routes not available: {e}")


@app.route("/api/upload", methods=["POST"])
def upload_files():
    if "files[]" not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    files = request.files.getlist("files[]")
    saved_files = []

    for file in files:
        if file.filename == "":
            continue
        if file:
            filename = file.filename
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            saved_files.append(filename)

    return jsonify(
        {
            "status": "success",
            "message": f"Uploaded {len(saved_files)} files.",
            "files": saved_files,
        }
    )


@app.route("/api/use_sample", methods=["POST"])
def use_sample():
    try:
        import shutil

        test_files = [
            ("test_nifty50 technicals.xlsx", "nifty50 technicals.xlsx"),
            ("test_nifty50-forecasts.xlsx", "nifty50-forecasts.xlsx"),
            ("test_nifty50-fundamentals.xlsx", "nifty50-fundamentals.xlsx"),
            (
                "test_nifty50-trendlynescores, benchmarks.xlsx",
                "nifty50-trendlynescores, benchmarks.xlsx",
            ),
        ]

        for src, dst in test_files:
            src_path = os.path.join(app.config["UPLOAD_FOLDER"], src)
            dst_path = os.path.join(app.config["UPLOAD_FOLDER"], dst)
            if os.path.exists(src_path):
                shutil.copy(src_path, dst_path)
            else:
                return jsonify(
                    {"status": "error", "message": f"Sample file {src} missing."}
                ), 500

        return jsonify({"status": "success", "message": "Sample data loaded."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/process", methods=["POST"])
def process_data():
    try:
        # Check if user wants to use new multi-source enrichment
        use_multi_source = (
            request.json.get("use_multi_source", False) if request.json else False
        )

        # Run scripts relative to THIS directory
        # The scripts use 'datasource/' paths. Since we are IN backend/, and datasource IS in backend/datasource,
        # we might need to change CWD or update scripts.
        # Easier hack: Change CWD to backend/ temporarily if not already.

        # Actually simplest is ensuring we run app.py from backend/ dir.
        print("Step 1: Cleaning Data...")
        clean_data.main()

        if use_multi_source:
            print("Step 2: Enriching Data (Multi-Source Strategy)...")
            import enrich_data_v2

            enrich_data_v2.main()
        else:
            print("Step 2: Enriching Data (yfinance)...")
            enrich_data.main()

        print("Step 3: Generating Insights...")
        generate_insights.main()

        return jsonify(
            {"status": "success", "message": "Pipeline completed successfully."}
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/stock/<symbol>/multi_source_data", methods=["GET"])
def get_multi_source_data(symbol):
    """
    Fetch stock data using multi-source strategy with quality metrics.
    Returns data from multiple sources with quality score.
    """
    try:
        from services.multi_source_data_service import multi_source_service

        data, quality = multi_source_service.fetch_stock_data(symbol)

        return jsonify({"status": "success", "data": data, "quality": quality})

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/results", methods=["GET"])
def get_results():
    # Output file is generated in backend/
    output_file = "backend/nifty50_final_analysis.xlsx"
    try:
        if os.path.exists(output_file):
            df = pd.read_excel(output_file)
            df = df.astype(object)
            df = df.replace([np.inf, -np.inf], None)
            df = df.where(pd.notnull(df), None)
            records = df.to_dict(orient="records")
            return jsonify({"status": "success", "data": records})
        else:
            return jsonify(
                {
                    "status": "error",
                    "message": "No analysis file found. Run processing first.",
                }
            ), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/clear", methods=["POST"])
def clear_data():
    try:
        generated_files = [
            "nifty50_unified_master.xlsx",
            "nifty50_enriched.xlsx",
            "nifty50_final_analysis.xlsx",
        ]
        for f in generated_files:
            if os.path.exists(f):
                os.remove(f)

        upload_folder = app.config["UPLOAD_FOLDER"]
        if os.path.exists(upload_folder):
            for filename in os.listdir(upload_folder):
                file_path = os.path.join(upload_folder, filename)
                if filename.endswith(".xlsx") and not filename.startswith("test_"):
                    try:
                        os.unlink(file_path)
                    except Exception as e:
                        print(f"Failed to delete {file_path}. Reason: {e}")

        return jsonify({"status": "success", "message": "Data cleared successfully."})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/stock/<symbol>/fundamentals", methods=["GET"])
def get_fundamentals(symbol):
    try:
        from services.market_data_service import market_data_service

        # Read statement type from query param (default: standalone)
        statement_type = request.args.get("type", "standalone")
        data = market_data_service.get_fundamentals(
            symbol, statement_type=statement_type
        )

        if "error" in data:
            # Just return 404 for not found/error, but include message
            return jsonify(data), 404

        return jsonify({"status": "success", "data": data})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/verify_symbols", methods=["GET"])
def verify_symbols():
    try:
        from services import verification_service

        result = verification_service.verify_files()
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/submit_corrections", methods=["POST"])
def submit_corrections():
    try:
        corrections = request.json
        if not corrections:
            return jsonify(
                {"status": "error", "message": "No corrections provided"}
            ), 400

        from services import verification_service

        count = verification_service.apply_corrections(corrections)

        return jsonify({"status": "success", "message": f"Updated {count} files."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ==================== SCREENER API ENDPOINTS ====================


@app.route("/api/screener/presets", methods=["GET"])
def get_screener_presets():
    """Get all available screening presets"""
    try:
        from services.screener_service import ScreenerPresets

        presets = ScreenerPresets.all_presets()

        # Return simplified preset info (without filters for listing)
        preset_list = []
        for key, preset in presets.items():
            preset_list.append(
                {
                    "id": key,
                    "name": preset["name"],
                    "description": preset["description"],
                    "filter_count": len(preset.get("filters", [])),
                }
            )

        return jsonify({"status": "success", "presets": preset_list})

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/screener/preset/<preset_name>", methods=["GET"])
def apply_screener_preset(preset_name):
    """Apply a preset screening strategy (Database-driven)"""
    try:
        # Try database-driven screener first
        try:
            from services.screener_db_service import db_screener

            result = db_screener.apply_preset(preset_name)

            return jsonify(
                {
                    "status": "success",
                    "results": result["results"],
                    "metadata": result["metadata"],
                    "source": "database",
                }
            )
        except Exception as db_error:
            print(f"Database screener failed, falling back to file: {db_error}")

            # Fallback to file-based screener for portfolio analysis
            from services.screener_service import create_screener

            screener = create_screener("nifty50_final_analysis.xlsx")

            if not screener:
                return jsonify(
                    {
                        "status": "error",
                        "message": "No data available. Initialize database or run processing.",
                    }
                ), 404

            # Apply preset
            result = screener.apply_preset(preset_name)

            # Convert DataFrame to records
            df = result["results"]
            df = df.astype(object)
            df = df.replace([np.inf, -np.inf], None)
            df = df.where(pd.notnull(df), None)
            records = df.to_dict(orient="records")

            return jsonify(
                {
                    "status": "success",
                    "results": records,
                    "metadata": result["metadata"],
                    "source": "portfolio",
                }
            )

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/screener/filter", methods=["POST"])
def apply_custom_filter():
    """Apply custom filters to screen stocks (Database-driven)"""
    try:
        data = request.json
        filters = data.get("filters", [])
        logic = data.get("logic", "AND")
        sort_by = data.get("sort_by")
        sort_order = data.get("sort_order", "desc")
        limit = data.get("limit")

        if not filters:
            return jsonify({"status": "error", "message": "No filters provided"}), 400

        # Try database-driven screener first
        try:
            from services.screener_db_service import db_screener

            result = db_screener.apply_filters(
                filters=filters,
                logic=logic,
                sort_by=sort_by,
                sort_order=sort_order,
                limit=limit,
            )

            return jsonify(
                {
                    "status": "success",
                    "results": result["results"],
                    "metadata": result["metadata"],
                    "source": "database",
                }
            )

        except Exception as db_error:
            print(f"Database screener failed, falling back to file: {db_error}")

            # Fallback to file-based screener
            from services.screener_service import create_screener

            screener = create_screener("nifty50_final_analysis.xlsx")

            if not screener:
                return jsonify(
                    {
                        "status": "error",
                        "message": "No data available. Initialize database or run processing.",
                    }
                ), 404

            # Apply filters
            filtered = screener.apply_filters(filters, logic=logic)

            # Apply sorting if requested
            if sort_by and not filtered.empty:
                filtered = screener.sort_results(
                    filtered, sort_by, ascending=(sort_order == "asc")
                )

            # Convert to records
            filtered = filtered.astype(object)
            filtered = filtered.replace([np.inf, -np.inf], None)
            filtered = filtered.where(pd.notnull(filtered), None)
            records = filtered.to_dict(orient="records")

            return jsonify(
                {
                    "status": "success",
                    "results": records,
                    "metadata": {
                        "total_matches": len(records),
                        "total_stocks": screener.original_count,
                        "match_rate": f"{(len(records) / screener.original_count * 100):.1f}%"
                        if screener.original_count > 0
                        else "0%",
                    },
                }
            )

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/screener/fields", methods=["GET"])
def get_screener_fields():
    """Get all available fields for screening with statistics"""
    try:
        from services.screener_service import create_screener

        screener = create_screener("nifty50_final_analysis.xlsx")

        if not screener:
            return jsonify(
                {
                    "status": "error",
                    "message": "No data available. Run processing first.",
                }
            ), 404

        fields = screener.get_available_fields()

        return jsonify({"status": "success", "fields": fields})

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/screener/field/<path:field_name>/stats", methods=["GET"])
def get_field_stats(field_name):
    """Get statistics for a specific field"""
    try:
        from services.screener_service import create_screener

        screener = create_screener("nifty50_final_analysis.xlsx")

        if not screener:
            return jsonify({"status": "error", "message": "No data available"}), 404

        stats = screener.get_field_stats(field_name)

        if not stats:
            return jsonify(
                {"status": "error", "message": f"Field '{field_name}' not found"}
            ), 404

        return jsonify({"status": "success", "stats": stats})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)

        screener = create_screener("nifty50_final_analysis.xlsx")

        if not screener:
            return jsonify(
                {
                    "status": "error",
                    "message": "No data available. Run processing first.",
                }
            ), 404

        fields = screener.get_available_fields()

        return jsonify({"status": "success", "fields": fields})

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/screener/field/<path:field_name>/stats", methods=["GET"])
def get_field_stats(field_name):
    """Get statistics for a specific field"""
    try:
        from services.screener_service import create_screener

        screener = create_screener("nifty50_final_analysis.xlsx")

        if not screener:
            return jsonify({"status": "error", "message": "No data available"}), 404

        stats = screener.get_field_stats(field_name)

        if not stats:
            return jsonify(
                {"status": "error", "message": f"Field '{field_name}' not found"}
            ), 404

        return jsonify({"status": "success", "stats": stats})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
