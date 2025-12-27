import os
import uuid
import jwt
from datetime import datetime
from dotenv import load_dotenv
from database.db_config import db_config

# Load env vars from project root
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env.local")
load_dotenv(env_path)
load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "super-secret-key-change-me")

def get_user_id_from_token(token: str):
    """Decodes JWT and returns user_id"""
    try:
        if token.startswith("Bearer "):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub") # Flask-JWT-Extended uses 'sub' for identity
    except Exception as e:
        print(f"JWT Decode Error: {e}")
        return None

def verify_thread_owner(thread_id: str, user_id: str):
    """Checks if a thread exists and belongs to the user"""
    query = "SELECT user_id FROM chat_threads WHERE id = ?"
    result = db_config.execute_query(query, (thread_id,), fetch_one=True)
    if result and result['user_id'] == user_id:
        return True
    return False

def ensure_thread_exists(thread_id: str, user_id: str, initial_title="New Analysis"):
    """Creates thread if it doesn't exist"""
    query = "SELECT id FROM chat_threads WHERE id = ?"
    exists = db_config.execute_query(query, (thread_id,), fetch_one=True)
    
    if not exists:
        insert_query = "INSERT INTO chat_threads (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        db_config.execute_query(insert_query, (thread_id, user_id, initial_title, datetime.utcnow(), datetime.utcnow()))
        return True
    return False

def save_message(thread_id: str, role: str, content: str):
    """Saves a message to the database"""
    msg_id = str(uuid.uuid4())
    query = "INSERT INTO chat_messages (id, thread_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
    db_config.execute_query(query, (msg_id, thread_id, role, content, datetime.utcnow()))
    
    # Update thread timestamp
    update_thread = "UPDATE chat_threads SET updated_at = ? WHERE id = ?"
    db_config.execute_query(update_thread, (datetime.utcnow(), thread_id))
    return msg_id

def auto_title_thread(thread_id: str, first_message: str):
    """Basic auto-titling logic (can be upgraded to LLM-based later)"""
    # Simple heuristic: take first 5-6 words
    words = first_message.split()[:6]
    title = " ".join(words)
    if len(first_message.split()) > 6:
        title += "..."
        
    query = "UPDATE chat_threads SET title = ? WHERE id = ? AND title = 'New Analysis'"
    db_config.execute_query(query, (title, thread_id))
