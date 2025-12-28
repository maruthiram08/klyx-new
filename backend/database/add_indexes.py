#!/usr/bin/env python3
"""
Add performance indexes to stocks database.
Run this after initial database population.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_config import db_config

def add_indexes():
    """Add all performance indexes to stocks table"""
    
    indexes = [
        # Original indexes
        "CREATE INDEX IF NOT EXISTS idx_sector ON stocks(sector_name)",
        "CREATE INDEX IF NOT EXISTS idx_industry ON stocks(industry_name)",
        "CREATE INDEX IF NOT EXISTS idx_market_cap ON stocks(market_cap)",
        "CREATE INDEX IF NOT EXISTS idx_pe_ratio ON stocks(pe_ttm)",
        "CREATE INDEX IF NOT EXISTS idx_roe ON stocks(roe_annual_pct)",
        "CREATE INDEX IF NOT EXISTS idx_last_updated ON stocks(last_updated)",
        
        # New indexes
        "CREATE INDEX IF NOT EXISTS idx_stocks_name ON stocks(stock_name)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_nse_code ON stocks(nse_code)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_quality ON stocks(data_quality_score)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_sector_quality ON stocks(sector_name, data_quality_score)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_name_lower ON stocks(LOWER(stock_name))",
        "CREATE INDEX IF NOT EXISTS idx_stocks_code_lower ON stocks(LOWER(nse_code))",
        "CREATE INDEX IF NOT EXISTS idx_stocks_pb_ratio ON stocks(pb_ratio)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_day_change ON stocks(day_change_pct)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_month_change ON stocks(month_change_pct)",
        "CREATE INDEX IF NOT EXISTS idx_stocks_market_cap_desc ON stocks(market_cap DESC)",
    ]
    
    print("Adding indexes to stocks table...")
    
    for idx, sql in enumerate(indexes, 1):
        try:
            db_config.execute_query(sql)
            print(f"✓ Created index {idx}/{len(indexes)}")
        except Exception as e:
            print(f"✗ Failed to create index {idx}: {e}")
    
    print("\n✅ All indexes created successfully!")
    
    # Verify indexes exist
    if getattr(db_config, 'is_production', False):
        # PostgreSQL
        verify_sql = """
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'stocks' 
            ORDER BY indexname
        """
    else:
        # SQLite
        verify_sql = """
            SELECT name 
            FROM sqlite_master 
            WHERE type = 'index' 
            AND tbl_name = 'stocks'
            ORDER BY name
        """
    
    try:
        indexes_result = db_config.execute_query(verify_sql)
        print(f"\nTotal indexes on stocks table: {len(indexes_result)}")
        for idx in indexes_result:
            index_name = idx.get('indexname') or idx.get('name')
            print(f"  - {index_name}")
    except Exception as e:
        print(f"Warning: Could not verify indexes: {e}")

if __name__ == "__main__":
    add_indexes()
