"""
Portfolio API routes for managing user portfolios
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import UserPortfolio, db

portfolio_bp = Blueprint("portfolio", __name__)


@portfolio_bp.route("/", methods=["GET"])
@jwt_required()
def get_portfolio():
    """Get current user's portfolio (list of stock names)"""
    try:
        user_id = get_jwt_identity()

        # Get all portfolio items for this user
        portfolio_items = UserPortfolio.query.filter_by(user_id=user_id).all()

        # Return list of stock names
        stock_names = [item.stock_name for item in portfolio_items]

        return jsonify(
            {
                "status": "success",
                "data": {"stock_names": stock_names, "count": len(stock_names)},
            }
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@portfolio_bp.route("/add", methods=["POST"])
@jwt_required()
def add_to_portfolio():
    """Add a stock to user's portfolio"""
    try:
        user_id = get_jwt_identity()
        data = request.json

        stock_name = data.get("stock_name")
        if not stock_name:
            return jsonify(
                {"status": "error", "message": "stock_name is required"}
            ), 400

        # Check if already in portfolio
        existing = UserPortfolio.query.filter_by(
            user_id=user_id, stock_name=stock_name
        ).first()

        if existing:
            return jsonify(
                {"status": "success", "message": "Stock already in portfolio"}
            )

        # Add to portfolio
        portfolio_item = UserPortfolio(user_id=user_id, stock_name=stock_name)
        db.session.add(portfolio_item)
        db.session.commit()

        return jsonify(
            {"status": "success", "message": f"{stock_name} added to portfolio"}
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@portfolio_bp.route("/remove", methods=["POST"])
@jwt_required()
def remove_from_portfolio():
    """Remove a stock from user's portfolio"""
    try:
        user_id = get_jwt_identity()
        data = request.json

        stock_name = data.get("stock_name")
        if not stock_name:
            return jsonify(
                {"status": "error", "message": "stock_name is required"}
            ), 400

        # Find and delete
        portfolio_item = UserPortfolio.query.filter_by(
            user_id=user_id, stock_name=stock_name
        ).first()

        if not portfolio_item:
            return jsonify(
                {"status": "error", "message": "Stock not in portfolio"}
            ), 404

        db.session.delete(portfolio_item)
        db.session.commit()

        return jsonify(
            {"status": "success", "message": f"{stock_name} removed from portfolio"}
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@portfolio_bp.route("/clear", methods=["POST"])
@jwt_required()
def clear_portfolio():
    """Clear user's entire portfolio"""
    try:
        user_id = get_jwt_identity()

        # Delete all portfolio items for this user
        UserPortfolio.query.filter_by(user_id=user_id).delete()
        db.session.commit()

        return jsonify({"status": "success", "message": "Portfolio cleared"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
