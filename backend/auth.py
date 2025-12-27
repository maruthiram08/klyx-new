"""
Authentication routes and utilities
"""

from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from models import User, db

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()
jwt = JWTManager()

# JWT blacklist for logout
jwt_blacklist = set()


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if token is revoked"""
    jti = jwt_payload["jti"]
    return jti in jwt_blacklist


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        # Validation
        if (
            not data
            or not data.get("email")
            or not data.get("password")
            or not data.get("name")
        ):
            return jsonify(
                {"status": "error", "message": "Email, password, and name are required"}
            ), 400

        email = data["email"].lower().strip()
        name = data["name"].strip()
        password = data["password"]

        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify(
                {"status": "error", "message": "Email already registered"}
            ), 409

        # Hash password
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        # Create new user
        new_user = User(email=email, name=name, password_hash=password_hash)

        db.session.add(new_user)
        db.session.commit()

        # Create tokens
        access_token = create_access_token(
            identity=new_user.id,
            additional_claims={"email": new_user.email, "name": new_user.name},
        )
        refresh_token = create_refresh_token(identity=new_user.id)

        return jsonify(
            {
                "status": "success",
                "message": "User registered successfully",
                "data": {
                    "user": new_user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                },
            }
        ), 201

    except Exception as e:
        db.session.rollback()
        return jsonify(
            {"status": "error", "message": f"Registration failed: {str(e)}"}
        ), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login user"""
    try:
        data = request.get_json()

        # Validation
        if not data or not data.get("email") or not data.get("password"):
            return jsonify(
                {"status": "error", "message": "Email and password are required"}
            ), 400

        email = data["email"].lower().strip()
        password = data["password"]
        
        print(f"DEBUG: Login attempt for {email}")

        # Find user
        user = User.query.filter_by(email=email).first()
        print(f"DEBUG: User found: {user}")

        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            print("DEBUG: Password check failed")
            return jsonify(
                {"status": "error", "message": "Invalid email or password"}
            ), 401

        # Create tokens
        access_token = create_access_token(
            identity=user.id, additional_claims={"email": user.email, "name": user.name}
        )
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify(
            {
                "status": "success",
                "message": "Login successful",
                "data": {
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                },
            }
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Login failed: {str(e)}"}), 500


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout user by revoking token"""
    try:
        jti = get_jwt()["jti"]
        jwt_blacklist.add(jti)

        return jsonify({"status": "success", "message": "Logout successful"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Logout failed: {str(e)}"}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        return jsonify({"status": "success", "data": {"user": user.to_dict()}}), 200

    except Exception as e:
        return jsonify(
            {"status": "error", "message": f"Failed to get user: {str(e)}"}
        ), 500


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        access_token = create_access_token(
            identity=user_id, additional_claims={"email": user.email, "name": user.name}
        )

        return jsonify(
            {"status": "success", "data": {"access_token": access_token}}
        ), 200

    except Exception as e:
        return jsonify(
            {"status": "error", "message": f"Token refresh failed: {str(e)}"}
        ), 500
