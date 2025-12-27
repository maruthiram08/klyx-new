"""
Database configuration for Vercel Postgres.

For local development: Uses SQLite
For production (Vercel): Uses Vercel Postgres (Neon)
"""

import os
import sqlite3
from contextlib import contextmanager
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor


class DatabaseConfig:
    """Database configuration manager"""

    def __init__(self):
        # Vercel Postgres connection string
        self.postgres_url = os.getenv("POSTGRES_URL")
        
        # Use PostgreSQL if POSTGRES_URL is set and USE_SQLITE is not explicitly true
        use_sqlite = os.getenv("USE_SQLITE", "false").lower() == "true"
        self.is_production = bool(self.postgres_url) and not use_sqlite

        # Local SQLite for development
        self.sqlite_path = os.path.join(os.path.dirname(__file__), "stocks.db")

    @contextmanager
    def get_connection(self):
        """Get database connection (Postgres or SQLite based on environment)"""
        if self.is_production and self.postgres_url:
            # Production: Use Vercel Postgres
            conn = psycopg2.connect(self.postgres_url, cursor_factory=RealDictCursor)
            try:
                yield conn
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()
        else:
            # Development: Use SQLite
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row
            try:
                yield conn
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
            finally:
                conn.close()

    def execute_query(self, query: str, params: tuple = None, fetch_one: bool = False):
        """Execute a query and return results"""
        # Convert SQLite placeholders (?) to PostgreSQL (%s) in production
        if self.is_production and self.postgres_url:
            query = query.replace("?", "%s")
            
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params or ())

            if query.strip().upper().startswith("SELECT"):
                if fetch_one:
                    result = cursor.fetchone()
                    return dict(result) if result else None
                else:
                    results = cursor.fetchall()
                    return [dict(row) for row in results]
            else:
                return cursor.rowcount

    def execute_many(self, query: str, params_list: list):
        """Execute query with multiple parameter sets"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(query, params_list)
            return cursor.rowcount

    def init_database(self):
        """Initialize database with schema"""
        schema_file = os.path.join(os.path.dirname(__file__), "schema.sql")

        if not os.path.exists(schema_file):
            print("Schema file not found")
            return False

        with open(schema_file, "r") as f:
            schema_sql = f.read()

        # Convert PostgreSQL schema to SQLite for development
        if not self.is_production:
            schema_sql = self._convert_to_sqlite(schema_sql)

        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Execute schema (split by semicolon for multiple statements)
                statements = schema_sql.split(";")
                for statement in statements:
                    if statement.strip():
                        cursor.execute(statement)

                print("✅ Database initialized successfully")
                return True
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            return False

    def _convert_to_sqlite(self, postgres_sql: str) -> str:
        """Convert PostgreSQL SQL to SQLite compatible SQL"""
        sql = postgres_sql

        # Replace PostgreSQL types with SQLite equivalents
        sql = sql.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        sql = sql.replace("DECIMAL(", "REAL(")
        sql = sql.replace("VARCHAR(", "TEXT(")
        sql = sql.replace("JSONB", "TEXT")
        sql = sql.replace("TIMESTAMP", "DATETIME")
        sql = sql.replace("CURRENT_TIMESTAMP", "datetime('now')")

        # Remove PostgreSQL-specific features
        sql = sql.replace("IF NOT EXISTS", "IF NOT EXISTS")

        # Remove OR REPLACE from CREATE VIEW (not supported in SQLite)
        sql = sql.replace("CREATE OR REPLACE VIEW", "CREATE VIEW IF NOT EXISTS")

        # Remove functions and triggers (SQLite has different syntax)
        # We'll handle these separately if needed
        lines = sql.split("\n")
        filtered_lines = []
        skip_block = False

        for line in lines:
            if "CREATE OR REPLACE FUNCTION" in line or "CREATE TRIGGER" in line:
                skip_block = True
            if skip_block and line.strip().endswith(";"):
                skip_block = False
                continue
            if not skip_block:
                filtered_lines.append(line)

        return "\n".join(filtered_lines)


# Singleton instance
db_config = DatabaseConfig()
