"""
Manual User Creator
Creates a user directly in the database to bypass API/Frontend issues.
"""

import os
import uuid
import psycopg2
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
    print("  Klyx - Manual User Registration")
    print("="*60)

    postgres_url = os.environ.get("POSTGRES_URL")
    if not postgres_url:
        print("❌ POSTGRES_URL not found")
        return

    email = "mnvmaruthiram@gmail.com"
    name = "Maruthi Ram" # Default name
    password = "password123" # Temporary password

    print(f"Creating user: {email}")
    print(f"Temporary Password: {password}")

    # Hash password
    app = Flask(__name__)
    bcrypt = Bcrypt(app)
    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user_id = str(uuid.uuid4())

    try:
        conn = psycopg2.connect(postgres_url)
        cur = conn.cursor()

        # Check if exists (double check)
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            print("❌ User already exists in DB!")
            conn.close()
            return

        # Insert
        cur.execute("""
            INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, email, name, pw_hash, datetime.utcnow(), datetime.utcnow()))
        
        conn.commit()
        print("✅ User created successfully!")
        conn.close()

    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    create_user()
