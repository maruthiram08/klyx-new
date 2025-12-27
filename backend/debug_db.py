"""
Database Debugger
Lists all tables in the connected PostgreSQL database.
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))

def check_db():
    url = os.environ.get("POSTGRES_URL")
    if not url:
        print("❌ POSTGRES_URL not found")
        return

    print(f"Connecting to: {url.split('@')[1] if '@' in url else '...'}")

    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        
        # List tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        
        print("\nTables found:")
        if not tables:
            print("  (No tables found - database is empty)")
        for t in tables:
            # Count rows
            try:
                cur.execute(f"SELECT COUNT(*) FROM {t[0]}")
                count = cur.fetchone()[0]
                print(f"  - {t[0]}: {count} rows")
                
                if t[0] == 'stocks':
                    cur.execute("SELECT data_quality_score, COUNT(*) FROM stocks GROUP BY data_quality_score")
                    scores = cur.fetchall()
                    print("    Quality Score Distribution:")
                    for s in scores:
                        print(f"      Score {s[0]}: {s[1]} stocks")
            except:
                print(f"  - {t[0]}: (could not count)")
            
        conn.close()
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    check_db()
