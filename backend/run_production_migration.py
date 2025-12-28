"""
Database Migration Script - Run on Production
Adds all new columns for Trendlyne Parity features
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_config import db_config

def run_migrations():
    """Run all pending migrations"""
    
    # Detect if using PostgreSQL or SQLite
    is_postgres = 'postgresql' in str(os.environ.get('POSTGRES_URL', ''))
    
    if is_postgres:
        # PostgreSQL syntax
        migrations = [
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS durability_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS valuation_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS momentum_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS roce_annual_pct DECIMAL(10,2)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS earnings_yield_pct DECIMAL(10,2)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS rel_strength_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS recommendation_key VARCHAR(50)",
            "ALTER TABLE stocks ADD COLUMN IF NOT EXISTS analyst_count INTEGER",
        ]
    else:
        # SQLite syntax (no IF NOT EXISTS for ALTER TABLE)
        print("⚠️  Running on SQLite - columns may already exist")
        migrations = [
            "ALTER TABLE stocks ADD COLUMN durability_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN valuation_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN momentum_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN roce_annual_pct REAL",
            "ALTER TABLE stocks ADD COLUMN earnings_yield_pct REAL",
            "ALTER TABLE stocks ADD COLUMN rel_strength_score INTEGER",
            "ALTER TABLE stocks ADD COLUMN target_price REAL",
            "ALTER TABLE stocks ADD COLUMN recommendation_key TEXT",
            "ALTER TABLE stocks ADD COLUMN analyst_count INTEGER",
        ]
    
    print("Running database migrations...")
    for i, migration in enumerate(migrations, 1):
        try:
            db_config.execute_query(migration)
            print(f"✅ Migration {i}/{len(migrations)}: {migration[:50]}...")
        except Exception as e:
            print(f"⚠️  Migration {i} failed (may already exist): {e}")
    
    print("\n✅ All migrations complete!")
    
    # Verify columns exist
    verify_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'stocks' 
        AND column_name IN (
            'durability_score', 'valuation_score', 'momentum_score',
            'roce_annual_pct', 'earnings_yield_pct', 'rel_strength_score',
            'target_price', 'recommendation_key', 'analyst_count'
        )
    """
    
    try:
        result = db_config.execute_query(verify_query, fetch_one=False)
        print(f"\n✅ Verified {len(result)} new columns exist in production database")
        for row in result:
            print(f"   - {row['column_name']}")
    except:
        print("⚠️  Could not verify columns (SQLite doesn't support information_schema)")

if __name__ == "__main__":
    run_migrations()
