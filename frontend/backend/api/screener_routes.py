"""
Screener API Routes (Database-Driven)
"""

from flask import Blueprint, jsonify, request
from services.screener_db_service import db_screener

screener_bp = Blueprint("screener", __name__)

@screener_bp.route("/filter", methods=["POST"])
def apply_filter():
    """Apply custom filters"""
    try:
        data = request.json or {}
        filters = data.get("filters", [])
        logic = data.get("logic", "AND")
        sort_by = data.get("sort_by")
        sort_order = data.get("sort_order", "desc")
        limit = data.get("limit", 50)

        result = db_screener.apply_filters(
            filters=filters,
            logic=logic,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit
        )

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@screener_bp.route("/presets", methods=["GET"])
def get_presets():
    """Get list of available presets"""
    try:
        # We can hardcode specific presets descriptions here or fetch from service
        # For now, matching the frontend expectation
        presets = [
            {"id": "value", "name": "Value Investing", "description": "Low P/E, High ROE, Strong fundamentals"},
            {"id": "growth", "name": "Growth Stocks", "description": "High revenue growth, strong momentum"},
            {"id": "momentum", "name": "Momentum Trading", "description": "Strong uptrend with positive momentum indicators"},
            {"id": "dividend", "name": "Dividend Aristocrats", "description": "High dividend yield with stable earnings"},
            {"id": "quality", "name": "Quality Stocks", "description": "Strong fundamentals across all metrics"},
            {"id": "garp", "name": "Undervalued Growth (GARP)", "description": "Growth stocks trading at reasonable valuations"},
            {"id": "breakout", "name": "Breakout Stocks", "description": "Stocks breaking out with strong technicals"},
            {"id": "low_volatility", "name": "Low Volatility", "description": "Low beta, stable price movement"}
        ]
        return jsonify({"status": "success", "data": presets})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@screener_bp.route("/preset/<preset_name>", methods=["GET"])
def apply_preset(preset_name):
    """Apply a preset strategy"""
    try:
        result = db_screener.apply_preset(preset_name)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@screener_bp.route("/fields", methods=["GET"])
def get_fields():
    """Get available fields"""
    try:
        fields = db_screener.get_available_fields()
        return jsonify({"status": "success", "data": fields})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
