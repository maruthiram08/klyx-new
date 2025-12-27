"""
Vercel Serverless Entry Point for Klyx API
Handles: Auth, Portfolio, Debt Optimizer, Screener, Database queries
Does NOT handle: Long-running enrichment tasks (see Render.com worker)
"""

import os
import sys

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Create Flask app
app = Flask(__name__)

# Configuration
app.config["SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "dev-secret-change-in-production"
)
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "dev-secret-change-in-production"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 2592000  # 30 days

# CORS configuration
cors_origin = os.environ.get("CORS_ORIGIN", "http://localhost:3000")
allowed_origins = cors_origin.split(",")
CORS(app, origins=allowed_origins, supports_credentials=True)

# Initialize JWT
jwt = JWTManager(app)

# Initialize Database and Bcrypt (Critical for Auth)
try:
    from models import db, User
    from auth import bcrypt
    
    # Database Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("POSTGRES_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    db.init_app(app)
    bcrypt.init_app(app)
    
except ImportError as e:
    print(f"Warning: Could not enable Database/Auth extensions: {e}")

# Register blueprints
try:
    from auth import auth_bp
    from debt_optimizer_routes import debt_optimizer_bp
    from portfolio_routes import portfolio_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(portfolio_bp, url_prefix="/api/portfolio")
    app.register_blueprint(debt_optimizer_bp, url_prefix="/api")
except ImportError as e:
    print(f"Warning: Could not import auth routes: {e}")

# Import API routes
try:
    from api.database_routes import db_routes
    from api.screener_routes import screener_bp

    app.register_blueprint(screener_bp, url_prefix="/api/screener")
    app.register_blueprint(db_routes, url_prefix="/api/database")
except ImportError as e:
    print(f"Warning: Could not import API routes: {e}")


# Debug endpoint for testing
@app.route("/api/debug/test_search")
def debug_test_search():
    """Test stock search functionality"""
    try:
        from database.db_config import DatabaseConfig
        db_config = DatabaseConfig()
        
        # Test query
        query = """
            SELECT stock_name, nse_code 
            FROM stocks 
            WHERE LOWER(stock_name) LIKE LOWER(%s) OR LOWER(nse_code) LIKE LOWER(%s)
            LIMIT 5
        """
        search_term = "%TCS%"
        results = db_config.execute_query(query, (search_term, search_term))
        
        return {
            "status": "success",
            "search_term": search_term,
            "results": results,
            "count": len(results) if results else 0
        }
    except Exception as e:
        import traceback
        return {
            "status": "error", 
            "message": str(e),
            "traceback": traceback.format_exc()
        }


# Health check endpoint
@app.route("/api/health")
def health():
    return {"status": "ok", "service": "vercel-api", "version": "1.0.0"}


# Root endpoint
@app.route("/")
def root():
    return {
        "message": "Klyx API",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "auth": "/api/auth/*",
            "portfolio": "/api/portfolio",
            "debt_optimizer": "/api/debt-optimizer/*",
            "screener": "/api/screener/*",
            "database": "/api/database/*",
        },
    }


# For local testing
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
