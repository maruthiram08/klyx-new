"""
One-time migration from local SQLite to Vercel Postgres
Run locally with POSTGRES_URL environment variable set to Vercel Postgres connection string

Usage:
    export POSTGRES_URL="postgresql://user:pass@host:5432/db"
    python3 migrate_to_vercel_postgres.py
"""

import os
import sqlite3
from datetime import datetime
import psycopg2

import math

def clean_value(val):
    # Handle timestamps
    if val == 'CURRENT_DATETIME':
        return datetime.now()
    
    # Handle floats
    if isinstance(val, float):
        if math.isinf(val) or math.isnan(val):
            return None
            
    # Handle strings looking like numbers
    if isinstance(val, str):
        v_lower = val.lower()
        if v_lower in ['inf', 'infinity', '-inf', '-infinity', 'nan']:
            return None
            
    return val

# Source databases (local SQLite)
SQLITE_KLYX = "instance/klyx.db"
SQLITE_STOCKS = "database/stocks.db"

# Target database (Vercel Postgres)
POSTGRES_URL = os.environ.get("POSTGRES_URL")

if not POSTGRES_URL:
    print("❌ Error: POSTGRES_URL environment variable not set!")
    print("\nUsage:")
    print("  export POSTGRES_URL='postgresql://user:pass@host:5432/db'")
    print("  python3 migrate_to_vercel_postgres.py")
    exit(1)


def migrate_table(sqlite_conn, pg_conn, table_name, transform=None):
    """
    Migrate single table from SQLite to PostgreSQL

    Args:
        sqlite_conn: SQLite connection
        pg_conn: PostgreSQL connection
        table_name: Table name to migrate
        transform: Optional function to transform row data before insert

    Returns:
        Number of rows migrated
    """
    sqlite_cur = sqlite_conn.cursor()
    pg_cur = pg_conn.cursor()

    try:
        # Get all rows from SQLite
        sqlite_cur.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cur.fetchall()

        if not rows:
            print(f"  ⚠ {table_name}: No data to migrate")
            return 0

        # Get column names
        columns = [desc[0] for desc in sqlite_cur.description]
        placeholders = ",".join(["%s"] * len(columns))

        # Build INSERT query with ON CONFLICT handling
        insert_sql = f"""
            INSERT INTO {table_name} ({",".join(columns)})
            VALUES ({placeholders})
            ON CONFLICT DO NOTHING
        """

        # Transform rows if needed
        if transform:
            rows = [transform(row) for row in rows]

        # Insert into PostgreSQL in batches
        batch_size = 100
        total_inserted = 0

        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            pg_cur.executemany(insert_sql, batch)
            pg_conn.commit()
            total_inserted += len(batch)

            if len(rows) > batch_size:
                print(f"    Progress: {total_inserted}/{len(rows)} rows", end="\r")

        print(f"  ✓ {table_name}: Migrated {len(rows)} rows")
        return len(rows)

    except Exception as e:
        print(f"  ✗ {table_name}: Error - {str(e)}")
        pg_conn.rollback()
        return 0


def migrate_users():
    """Migrate user data from klyx.db"""
    print("\n=== Migrating User Data ===")

    if not os.path.exists(SQLITE_KLYX):
        print(f"⚠ {SQLITE_KLYX} not found - skipping user data")
        return 0

    # Connect to databases
    klyx_conn = sqlite3.connect(SQLITE_KLYX)
    pg_conn = psycopg2.connect(POSTGRES_URL, sslmode="require")

    total_rows = 0

    # Migrate tables
    for table in ["users", "user_portfolio", "debt_scenarios"]:
        try:
            rows = migrate_table(klyx_conn, pg_conn, table)
            total_rows += rows
        except Exception as e:
            print(f"  ✗ {table}: {str(e)}")

    # Close connections
    klyx_conn.close()
    pg_conn.close()

    return total_rows


def migrate_stocks():
    """Migrate stock data from stocks.db"""
    print("\n=== Migrating Stock Data ===")

    if not os.path.exists(SQLITE_STOCKS):
        print(f"⚠ {SQLITE_STOCKS} not found - skipping stock data")
        return 0

    # Connect to databases
    stocks_conn = sqlite3.connect(SQLITE_STOCKS)
    pg_conn = psycopg2.connect(POSTGRES_URL, sslmode="require")

    total_rows = 0

    # Migrate tables
    for table in ["stocks", "stock_metadata", "data_refresh_log"]:
        try:
            # Define transform for stocks table to fix corrupted values
            transform_func = None
            if table == 'stocks':
                def clean_stock_row(row):
                    # Clean every value in the row
                    return tuple(clean_value(x) for x in row)
                transform_func = clean_stock_row

            rows = migrate_table(stocks_conn, pg_conn, table, transform=transform_func)
            total_rows += rows
        except Exception as e:
            print(f"  ✗ {table}: {str(e)}")

    # Close connections
    stocks_conn.close()
    pg_conn.close()

    return total_rows


def verify_migration():
    """Verify migration was successful"""
    print("\n=== Verifying Migration ===")

    pg_conn = psycopg2.connect(POSTGRES_URL, sslmode="require")
    pg_cur = pg_conn.cursor()

    # Check stock count
    pg_cur.execute("SELECT COUNT(*) FROM stocks")
    stock_count = pg_cur.fetchone()[0]
    print(f"  Stocks in database: {stock_count}")

    # Check enriched stocks
    pg_cur.execute(
        "SELECT COUNT(*) FROM stocks WHERE sector_name IS NOT NULL AND sector_name != ''"
    )
    enriched_count = pg_cur.fetchone()[0]
    enriched_pct = (enriched_count / stock_count * 100) if stock_count > 0 else 0
    print(f"  Enriched stocks: {enriched_count} ({enriched_pct:.1f}%)")

    # Check user count (if exists)
    try:
        pg_cur.execute("SELECT COUNT(*) FROM users")
        user_count = pg_cur.fetchone()[0]
        print(f"  Users: {user_count}")
    except:
        print(f"  Users: 0 (no user data migrated)")

    pg_conn.close()

    if stock_count > 0:
        print("\n✅ Migration verification successful!")
    else:
        print("\n⚠️ Warning: No stocks found in database!")


def main():
    """Main migration function"""
    print("=" * 60)
    print("  Klyx - SQLite to Vercel Postgres Migration")
    print("=" * 60)

    # Show connection info (hide password)
    db_host = (
        POSTGRES_URL.split("@")[1].split(":")[0] if "@" in POSTGRES_URL else "unknown"
    )
    print(f"\nTarget database: {db_host}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Run migrations
    user_rows = migrate_users()
    stock_rows = migrate_stocks()

    total_rows = user_rows + stock_rows

    # Verify
    if total_rows > 0:
        verify_migration()

    print(f"\n{'=' * 60}")
    print(f"Migration completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total rows migrated: {total_rows}")
    print(f"{'=' * 60}")

    print("\n✅ Next steps:")
    print("  1. Verify data in Vercel Postgres dashboard")
    print("  2. Test API endpoints with production database")
    print("  3. Deploy to Vercel: vercel --prod")


if __name__ == "__main__":
    main()
