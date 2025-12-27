"""
Manual User Creator
Creates a user directly in the database to bypass API/Frontend issues.
"""

import os
import uuid
import sqlite3
from flask import Flask
from flask_bcrypt import Bcrypt
from datetime import datetime

# Load env vars
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))
except ImportError:
    pass

def create_user():
    print("="*60)
    print("  Klyx - Manual User Registration (SQLite)")
    print("="*60)

    # Database path
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database", "stocks.db")
    print(f"Database: {db_path}")

    email = "test@example.com"
    name = "Test User"
    password = "password123"

    print(f"Creating user: {email}")
    print(f"Password: {password}")

    # Hash password
    app = Flask(__name__)
    bcrypt = Bcrypt(app)
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user_id = str(uuid.uuid4())

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # Check if exists
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            print("❌ User already exists! Updating password...")
            cur.execute("UPDATE users SET password_hash = ? WHERE email = ?", (pw_hash, email))
            print("✅ Password updated.")
        else:
            # Insert
            cur.execute("""
                INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, email, name, pw_hash, datetime.utcnow(), datetime.utcnow()))
            print("✅ User created successfully!")
        
        conn.commit()
        conn.close()

    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    create_user()
