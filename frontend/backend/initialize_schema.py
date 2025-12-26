import os
import psycopg2

# Read schema file
SCHEMA_FILE = 'backend/database/schema.sql'
POSTGRES_URL = os.environ.get('POSTGRES_URL')

if not POSTGRES_URL:
    print("❌ Error: POSTGRES_URL environment variable not set!")
    exit(1)

def run_schema():
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        print(f"Reading schema from {SCHEMA_FILE}...")
        with open(SCHEMA_FILE, 'r') as f:
            schema_sql = f.read()
            
        print("Executing schema...")
        cur.execute(schema_sql)
        conn.commit()
        
        print("✅ Schema initialized successfully!")
        
        # Verify tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        print("\nCreated Tables:")
        for table in tables:
            print(f"- {table[0]}")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error initializing schema: {str(e)}")
        exit(1)

if __name__ == "__main__":
    run_schema()
