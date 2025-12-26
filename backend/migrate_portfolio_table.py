"""
Migration script to recreate user_portfolio table with stock_name instead of nse_code.

IMPORTANT: This will delete all existing portfolio data!
Run this ONLY if you understand the consequences.
"""

from app import app, db
from models import UserPortfolio


def migrate_portfolio_table():
    """
    Drop and recreate the user_portfolio table with new schema.
    """
    with app.app_context():
        print("=" * 60)
        print("MIGRATION: Recreating user_portfolio table")
        print("=" * 60)

        # Check if table exists
        inspector = db.inspect(db.engine)
        if "user_portfolio" in inspector.get_table_names():
            print("\n⚠️  WARNING: user_portfolio table exists and will be DELETED!")
            print("⚠️  All existing portfolio data will be LOST!")

            confirm = input("\nType 'YES' to continue: ")
            if confirm != "YES":
                print("Migration cancelled.")
                return

            # Drop the table
            print("\n🗑️  Dropping user_portfolio table...")
            UserPortfolio.__table__.drop(db.engine)
            print("✅ Table dropped")

        # Create the new table
        print("\n📝 Creating user_portfolio table with new schema...")
        UserPortfolio.__table__.create(db.engine)
        print("✅ Table created with stock_name column")

        print("\n" + "=" * 60)
        print("Migration completed successfully!")
        print("=" * 60)
        print("\nNew schema:")
        print("  - user_id (FK to users)")
        print("  - stock_name (replaced nse_code)")
        print("  - added_at")
        print("\nUnique constraint: (user_id, stock_name)")


if __name__ == "__main__":
    migrate_portfolio_table()
