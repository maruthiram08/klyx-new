import json
import os
import sys
import threading

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import jwt_required, get_jwt_identity

# Load environment variables from project root
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)
load_dotenv()

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


import clean_data
import enrich_data
import generate_insights

app = Flask(__name__)

# Configure Database
# USE_SQLITE=true forces local database even if POSTGRES_URL is set
use_sqlite = os.environ.get("USE_SQLITE", "false").lower() == "true"
postgres_url = os.environ.get("POSTGRES_URL") if not use_sqlite else None

if postgres_url:
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = postgres_url
    print("✓ Using PostgreSQL database")
else:
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database", "stocks.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    print(f"✓ Using SQLite database: {db_path}")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-key-change-me")

from models import db
from auth import auth_bp, bcrypt, jwt
from cache_config import cache  # Import cache extension
from portfolio_routes import portfolio_bp
from debt_optimizer_routes import debt_optimizer_bp
from chat_routes import chat_bp

# Rate Limiting Configuration
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Use Redis for rate limiting in production (shared across workers)
def get_rate_limit_storage():
    redis_url = os.environ.get("REDIS_URL")
    if redis_url:
        # Handle Upstash SSL requirements
        if 'upstash.io' in redis_url and redis_url.startswith('redis://'):
            redis_url = redis_url.replace('redis://', 'rediss://', 1)
        return redis_url
    return "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["1000 per hour", "100 per minute"],
    storage_uri=get_rate_limit_storage(),
)
print(f"✓ Rate limiter storage: {'Redis' if os.environ.get('REDIS_URL') else 'In-Memory'}")


# Initialize extensions
db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
cache.init_app(app)  # Initialize cache


# Security Headers
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # HSTS only in production (HTTPS)
    if os.environ.get('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response

# Create tables
with app.app_context():
    db.create_all()

# Enable CORS
CORS(
    app,
    resources={r"/*": {"origins": [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3005",
        "http://localhost:3001",
        "https://projectklyx.vercel.app",
        "https://*.vercel.app"
    ]}},
    supports_credentials=True,
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
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(portfolio_bp, url_prefix="/api")
    app.register_blueprint(debt_optimizer_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    print("✓ All blueprints registered")
except Exception as e:
    print(f"⚠ Blueprint registration failed: {e}")


@app.route("/api/upload", methods=["POST"])
@jwt_required(optional=True)
def upload_files():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"status": "error", "message": "Authentication required for portfolio analysis"}), 401

    if "files[]" not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    files = request.files.getlist("files[]")
    saved_files = []
    stocks_added = 0
    
    from models import UserPortfolio, db

    for file in files:
        if file.filename == "":
            continue
        if file:
            filename = file.filename
            # Process file immediately to DB (don't rely on fs)
            try:
                # Read file into pandas
                if filename.endswith('.csv'):
                    df = pd.read_csv(file)
                else:
                    df = pd.read_excel(file)
                
                # Normalize columns
                df.columns = df.columns.astype(str).str.strip()
                
                # Find stock column
                stock_col = None
                code_col = None
                
                possible_names = ['Stock Name', 'Symbol', 'Ticker', 'Company']
                possible_codes = ['NSE Code', 'ISIN', 'Symbol', 'Code']
                
                for col in df.columns:
                    if col in possible_names:
                        stock_col = col
                    if col in possible_codes:
                        code_col = col
                        
                if stock_col:
                    stocks = df[stock_col].dropna().unique()
                    
                    # Add to UserPortfolio
                    for stock in stocks:
                        stock_name = str(stock).strip()
                        if not stock_name:
                            continue
                            
                        # Check exist
                        existing = UserPortfolio.query.filter_by(
                            user_id=user_id, 
                            stock_name=stock_name
                        ).first()
                        
                        if not existing:
                            new_item = UserPortfolio(
                                user_id=user_id,
                                stock_name=stock_name
                            )
                            db.session.add(new_item)
                            stocks_added += 1
                    
                    db.session.commit()
                    saved_files.append(filename)
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
                return jsonify({"status": "error", "message": f"Failed to process {filename}: {str(e)}"}), 500

    return jsonify(
        {
            "status": "success",
            "message": f"Processed {len(saved_files)} files. Added {stocks_added} new stocks to portfolio.",
            "files": saved_files,
            "stocks_added": stocks_added
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
@jwt_required(optional=True)
def process_data():
    """
    Start background portfolio processing task.
    Returns task ID for status tracking.
    """
    user_id = get_jwt_identity()
    if not user_id:
        # Fallback for dev/testing if needed, but DB-first requires user context
        return jsonify({"status": "error", "message": "Login required to process portfolio"}), 401

    try:
        # Check if portfolio has items
        from models import UserPortfolio
        count = UserPortfolio.query.filter_by(user_id=user_id).count()
        if count == 0:
             return jsonify({"status": "error", "message": "Portfolio is empty. Please upload stocks first."}), 400

        # Try to use Celery for background processing
        try:
            from tasks.portfolio_tasks import process_portfolio_task
            
            # Start background task (always use multi-source)
            task = process_portfolio_task.delay(user_id, use_multi_source=True)
            
            return jsonify({
                "status": "processing",
                "task_id": task.id,
                "message": "Portfolio processing started in background",
                "check_status_url": f"/api/process/status/{task.id}"
            })
            
        except Exception as celery_error:
            # Fallback to synchronous processing (using task logic directly)
            print(f"Celery error ({celery_error}), running synchronously...")
            from tasks.portfolio_tasks import process_portfolio_task
            
            # Run synchronously (blocking)
            # We use apply() to run the task locally
            result = process_portfolio_task.apply(args=[user_id, True])
            
            # Since it's sync, user will wait (might timeout on Vercel if >10s)
            return jsonify({
                 "status": "completed",
                 "message": "Portfolio processed successfully (Synchronous)",
                 "data": "Refresh results page"
            })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route("/api/process/status/<task_id>", methods=["GET"])
def check_process_status(task_id):
    """
    Check the status of a background processing task.
    
    Returns:
        {
            "status": "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE",
            "progress": { current, total, percent, message },
            "result": { ... } (if completed)
        }
    """
    try:
        from celery_app import celery_app
        
        task = celery_app.AsyncResult(task_id)
        
        response = {
            "status": task.state,
            "task_id": task_id
        }
        
        if task.state == 'PENDING':
            response['message'] = 'Task is waiting to start...'
            
        elif task.state == 'PROGRESS':
            response['progress'] = task.info
            response['message'] = task.info.get('message', 'Processing...')
            
        elif task.state == 'SUCCESS':
            response['result'] = task.result
            response['message'] = 'Processing completed successfully'
            
        elif task.state == 'FAILURE':
            response['error'] = str(task.info)
            response['message'] = 'Processing failed'
        
        return jsonify(response)
    
    except Exception as e:
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
@jwt_required(optional=True)
def get_results():
    user_id = get_jwt_identity()
    
    # If anonymous, we can't fetch personalized results easily unless we track session
    # For now, require auth or return empty
    if not user_id:
        return jsonify({"status": "error", "message": "Login required to view analysis results"}), 401

    try:
        from models import UserAnalysis
        
        # Fetch from DB
        analyses = UserAnalysis.query.filter_by(user_id=user_id).all()
        
        if not analyses:
            return jsonify({
                "status": "error", 
                "message": "No analysis found. Please upload portfolio and click Process."
            }), 404
            
        # Convert to list of dicts
        # Flatten the structure: merge metadata with analysis_data
        records = []
        for analysis in analyses:
            record = analysis.analysis_data or {}
            record['Stock Name'] = analysis.stock_name
            record['NSE Code'] = analysis.nse_code
            records.append(record)
            
        return jsonify({"status": "success", "data": records})

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


from cache_utils import cache_response

@app.route("/api/screener/presets", methods=["GET"])
@cache_response(max_age=3600)
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

        return jsonify({"status": "success", "data": preset_list})

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
        from services.screener_db_service import DatabaseScreener
        
        screener = DatabaseScreener()
        fields = screener.get_available_fields()
        
        return jsonify({"status": "success", "data": fields})
        
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


@app.route("/api/health", methods=["GET"])
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
