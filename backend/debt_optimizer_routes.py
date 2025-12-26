"""
Debt Optimizer API routes for managing user debt scenarios
"""

import json

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import DebtScenario, db

debt_optimizer_bp = Blueprint("debt_optimizer", __name__)


@debt_optimizer_bp.route("/debt-optimizer/scenarios", methods=["GET"])
@jwt_required()
def get_scenarios():
    """Get all debt scenarios for the current user"""
    try:
        user_id = get_jwt_identity()

        # Get all scenarios for this user
        scenarios = (
            DebtScenario.query.filter_by(user_id=user_id)
            .order_by(DebtScenario.updated_at.desc())
            .all()
        )

        return jsonify(
            {
                "status": "success",
                "data": {
                    "scenarios": [s.to_dict() for s in scenarios],
                    "count": len(scenarios),
                },
            }
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@debt_optimizer_bp.route("/debt-optimizer/scenarios", methods=["POST"])
@jwt_required()
def create_scenario():
    """Create a new debt scenario"""
    try:
        user_id = get_jwt_identity()
        data = request.json

        name = data.get("name")
        debts = data.get("debts", [])
        monthly_budget = data.get("monthlyBudget")
        is_current = data.get("isCurrent", False)

        if not name:
            return jsonify({"status": "error", "message": "name is required"}), 400

        if not monthly_budget:
            return jsonify(
                {"status": "error", "message": "monthlyBudget is required"}
            ), 400

        # Check if scenario with same name exists
        existing = DebtScenario.query.filter_by(user_id=user_id, name=name).first()

        if existing:
            return jsonify(
                {"status": "error", "message": f"Scenario '{name}' already exists"}
            ), 400

        # If this is marked as current, unmark all others
        if is_current:
            DebtScenario.query.filter_by(user_id=user_id, is_current=True).update(
                {"is_current": False}
            )

        # Create new scenario
        scenario = DebtScenario(
            user_id=user_id,
            name=name,
            debts=json.dumps(debts),
            monthly_budget=monthly_budget,
            is_current=is_current,
        )

        db.session.add(scenario)
        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "message": f"Scenario '{name}' created",
                "data": scenario.to_dict(),
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@debt_optimizer_bp.route("/debt-optimizer/scenarios/<int:scenario_id>", methods=["PUT"])
@jwt_required()
def update_scenario(scenario_id):
    """Update an existing debt scenario"""
    try:
        user_id = get_jwt_identity()
        data = request.json

        # Find the scenario
        scenario = DebtScenario.query.filter_by(id=scenario_id, user_id=user_id).first()

        if not scenario:
            return jsonify({"status": "error", "message": "Scenario not found"}), 404

        # Update fields
        if "name" in data:
            # Check if new name conflicts with another scenario
            if data["name"] != scenario.name:
                existing = DebtScenario.query.filter_by(
                    user_id=user_id, name=data["name"]
                ).first()
                if existing:
                    return jsonify(
                        {
                            "status": "error",
                            "message": f"Scenario '{data['name']}' already exists",
                        }
                    ), 400
            scenario.name = data["name"]

        if "debts" in data:
            scenario.debts = json.dumps(data["debts"])

        if "monthlyBudget" in data:
            scenario.monthly_budget = data["monthlyBudget"]

        if "isCurrent" in data:
            if data["isCurrent"]:
                # Unmark all other scenarios
                DebtScenario.query.filter_by(user_id=user_id, is_current=True).update(
                    {"is_current": False}
                )
            scenario.is_current = data["isCurrent"]

        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "message": "Scenario updated",
                "data": scenario.to_dict(),
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@debt_optimizer_bp.route(
    "/debt-optimizer/scenarios/<int:scenario_id>", methods=["DELETE"]
)
@jwt_required()
def delete_scenario(scenario_id):
    """Delete a debt scenario"""
    try:
        user_id = get_jwt_identity()

        # Find the scenario
        scenario = DebtScenario.query.filter_by(id=scenario_id, user_id=user_id).first()

        if not scenario:
            return jsonify({"status": "error", "message": "Scenario not found"}), 404

        name = scenario.name
        db.session.delete(scenario)
        db.session.commit()

        return jsonify({"status": "success", "message": f"Scenario '{name}' deleted"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@debt_optimizer_bp.route("/debt-optimizer/current", methods=["GET"])
@jwt_required()
def get_current_scenario():
    """Get the current active scenario"""
    try:
        user_id = get_jwt_identity()

        # Find current scenario
        scenario = DebtScenario.query.filter_by(
            user_id=user_id, is_current=True
        ).first()

        if not scenario:
            return jsonify(
                {"status": "success", "data": None, "message": "No current scenario"}
            )

        return jsonify({"status": "success", "data": scenario.to_dict()})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@debt_optimizer_bp.route("/debt-optimizer/current", methods=["PUT"])
@jwt_required()
def save_current_scenario():
    """Save the current working scenario (auto-save)"""
    try:
        user_id = get_jwt_identity()
        data = request.json

        debts = data.get("debts", [])
        monthly_budget = data.get("monthlyBudget", 0)

        if not monthly_budget:
            return jsonify(
                {"status": "error", "message": "monthlyBudget is required"}
            ), 400

        # Find or create "Current" scenario
        scenario = DebtScenario.query.filter_by(
            user_id=user_id, is_current=True
        ).first()

        if scenario:
            # Update existing
            scenario.debts = json.dumps(debts)
            scenario.monthly_budget = monthly_budget
        else:
            # Create new "Current" scenario
            scenario = DebtScenario(
                user_id=user_id,
                name="Current",
                debts=json.dumps(debts),
                monthly_budget=monthly_budget,
                is_current=True,
            )
            db.session.add(scenario)

        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "message": "Current scenario saved",
                "data": scenario.to_dict(),
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@debt_optimizer_bp.route("/debt-optimizer/migrate", methods=["POST"])
@jwt_required()
def migrate_from_localstorage():
    """
    Migrate debt scenarios from localStorage to database.
    Accepts localStorage data and creates database entries.
    """
    try:
        user_id = get_jwt_identity()
        data = request.json

        current_scenario = data.get("currentScenario")
        saved_scenarios = data.get("savedScenarios", [])

        migrated_count = 0

        # Migrate current scenario
        if current_scenario:
            existing = DebtScenario.query.filter_by(
                user_id=user_id, name="Current"
            ).first()

            if not existing:
                scenario = DebtScenario(
                    user_id=user_id,
                    name="Current",
                    debts=json.dumps(current_scenario.get("debts", [])),
                    monthly_budget=current_scenario.get("monthlyBudget", 0),
                    is_current=True,
                )
                db.session.add(scenario)
                migrated_count += 1

        # Migrate saved scenarios
        for saved in saved_scenarios:
            name = saved.get("name", "Untitled")

            # Skip if already exists
            existing = DebtScenario.query.filter_by(user_id=user_id, name=name).first()

            if not existing:
                scenario = DebtScenario(
                    user_id=user_id,
                    name=name,
                    debts=json.dumps(saved.get("debts", [])),
                    monthly_budget=saved.get("monthlyBudget", 0),
                    is_current=False,
                )
                db.session.add(scenario)
                migrated_count += 1

        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "message": f"Migrated {migrated_count} scenarios from localStorage",
                "data": {"migrated_count": migrated_count},
            }
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
