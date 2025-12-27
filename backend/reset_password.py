"""
Password Reset Utility
Run this locally to reset a user's password in the production database.

Usage:
    export POSTGRES_URL="<your_connection_string>" (if not already set in .env.local)
    python3 reset_password.py
"""

import os
import sys
import psycopg2
from flask import Flask
from flask_bcrypt import Bcrypt

# Load environment variables if possible
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))
except ImportError:
    pass

def reset_password():
    print("="*60)
    print("  Klyx - Password Reset Tool")
    print("="*60)

    # Check for DB Connection
    postgres_url = os.environ.get("POSTGRES_URL")
    if not postgres_url:
        print("❌ Error: POSTGRES_URL not found.")
        print("Run: vercel env pull .env.local")
        return

    # Get inputs
    email = input("Enter email address: ").strip().lower()
    if not email:
        print("❌ Email required.")
        return

    new_password = input("Enter new password: ").strip()
    if not new_password:
        print("❌ Password required.")
        return

    # Generate Hash
    print("\nGenerating password hash...")
    app = Flask(__name__)
    bcrypt = Bcrypt(app)
    pw_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")

    # Update DB
    try:
        conn = psycopg2.connect(postgres_url)
        cur = conn.cursor()

        # Check user exists
        cur.execute("SELECT id, name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            print(f"❌ User '{email}' not found in database.")
            return

        print(f"Found user: {user[1]} (ID: {user[0]})")
        
        # Update
        cur.execute("UPDATE users SET password_hash = %s WHERE email = %s", (pw_hash, email))
        conn.commit()
        
        if cur.rowcount > 0:
            print("✅ Password updated successfully.")
        else:
            print("⚠️ No rows updated.")

        conn.close()

    except Exception as e:
        print(f"❌ Database error: {str(e)}")

if __name__ == "__main__":
    reset_password()
