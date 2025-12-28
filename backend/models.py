"""
Database models for the application
"""

import uuid
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """User model for authentication"""

    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship to portfolio
    portfolio = db.relationship(
        "UserPortfolio", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        """Convert user to dictionary (excluding password)"""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserPortfolio(db.Model):
    """User portfolio - tracks which stocks a user has added to their portfolio"""

    __tablename__ = "user_portfolio"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    stock_name = db.Column(db.String(255), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to user
    user = db.relationship("User", back_populates="portfolio")

    # Unique constraint: one stock per user
    __table_args__ = (
        db.UniqueConstraint("user_id", "stock_name", name="unique_user_stock"),
    )

    def __repr__(self):
        return f"<UserPortfolio user={self.user_id} stock={self.stock_name}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "stock_name": self.stock_name,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }


class DebtScenario(db.Model):
    """Debt optimizer scenarios - stores user's debt payoff plans"""

    __tablename__ = "debt_scenarios"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    name = db.Column(db.String(255), nullable=False)
    debts = db.Column(db.Text, nullable=False)  # JSON string
    monthly_budget = db.Column(db.Float, nullable=False)
    is_current = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship to user
    user = db.relationship("User", backref="debt_scenarios")

    # Unique constraint: one scenario name per user
    __table_args__ = (
        db.UniqueConstraint("user_id", "name", name="unique_user_scenario"),
        db.Index("idx_user_current", "user_id", "is_current"),
    )

    def __repr__(self):
        return f"<DebtScenario user={self.user_id} name={self.name}>"

    def to_dict(self):
        """Convert to dictionary"""
        import json

        return {
            "id": self.id,
            "name": self.name,
            "debts": json.loads(self.debts) if self.debts else [],
            "monthlyBudget": self.monthly_budget,
            "isCurrent": self.is_current,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class ChatThread(db.Model):
    """Chat threads for AI sessions"""

    __tablename__ = "chat_threads"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    title = db.Column(db.String(255), nullable=False, default="New Analysis")
    is_archived = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", backref="chat_threads")
    messages = db.relationship(
        "ChatMessage", back_populates="thread", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "isArchived": self.is_archived,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class ChatMessage(db.Model):
    """Individual messages within a chat thread"""

    __tablename__ = "chat_messages"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = db.Column(
        db.String(36), db.ForeignKey("chat_threads.id"), nullable=False, index=True
    )
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to thread
    thread = db.relationship("ChatThread", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "threadId": self.thread_id,
            "role": self.role,
            "content": self.content,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class UserAnalysis(db.Model):
    """Stores the results of portfolio analysis/enrichment"""

    __tablename__ = "user_analysis"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    stock_name = db.Column(db.String(255), nullable=False)
    nse_code = db.Column(db.String(50))
    analysis_data = db.Column(db.JSON)  # Stores the full enriched data row
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="analyses")

    def to_dict(self):
        data = self.analysis_data or {}
        # Ensure ID and metadata are included
        data["id"] = self.id
        data["user_id"] = self.user_id
        data["stock_name"] = self.stock_name
        data["nse_code"] = self.nse_code
        data["analyzed_at"] = self.created_at.isoformat() if self.created_at else None
        return data
