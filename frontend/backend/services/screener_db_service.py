"""
Database-Driven Stock Screener Service.

This version queries the stock database instead of Excel files.
Designed for production use with Vercel Postgres.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from typing import Any, Dict, List, Optional

from database.db_config import db_config

logger = logging.getLogger(__name__)



class ScreenerPresets:
    """Pre-built screening strategies"""

    @staticmethod
    def value_investing() -> Dict:
        """Value Investing Strategy - Undervalued stocks"""
        return {
            "name": "Value Investing",
            "description": "Low P/E, High ROE, Strong fundamentals",
            "filters": [
                {"field": "PE TTM Price to Earnings", "operator": "lt", "value": 20},
                {"field": "PE TTM Price to Earnings", "operator": "gt", "value": 0},
                {"field": "ROE Annual %", "operator": "gte", "value": 15},
                {
                    "field": "Market Capitalization",
                    "operator": "gt",
                    "value": 10000000000,
                },  # >1000 Cr
                {"field": "Debt to Equity Ratio", "operator": "lt", "value": 1},
                {"field": "Current Ratio", "operator": "gt", "value": 1.5},
            ],
            "sort": {"field": "PE TTM Price to Earnings", "order": "asc"},
        }

    @staticmethod
    def growth_stocks() -> Dict:
        """Growth Stock Strategy - High growth companies"""
        return {
            "name": "Growth Stocks",
            "description": "High revenue growth, strong momentum",
            "filters": [
                {
                    "field": "Revenue Growth Annual YoY %",
                    "operator": "gte",
                    "value": 20,
                },
                {
                    "field": "Net Profit Annual YoY Growth %",
                    "operator": "gte",
                    "value": 15,
                },
                {"field": "ROE Annual %", "operator": "gte", "value": 18},
                {
                    "field": "Market Capitalization",
                    "operator": "gt",
                    "value": 5000000000,
                },
            ],
            "sort": {"field": "Revenue Growth Annual YoY %", "order": "desc"},
        }

    @staticmethod
    def momentum_trading() -> Dict:
        """Momentum Strategy - Strong price momentum"""
        return {
            "name": "Momentum Trading",
            "description": "Strong uptrend with positive momentum indicators",
            "filters": [
                {"field": "Month Change %", "operator": "gt", "value": 5},
                {"field": "Qtr Change %", "operator": "gt", "value": 10},
                {"field": "Day RSI", "operator": "between", "value": [40, 70]},
                {"field": "Trendlyne Momentum Score", "operator": "gte", "value": 60},
            ],
            "sort": {"field": "Month Change %", "order": "desc"},
        }

    @staticmethod
    def dividend_aristocrats() -> Dict:
        """Dividend Strategy - High dividend yield"""
        return {
            "name": "Dividend Aristocrats",
            "description": "High dividend yield with stable earnings",
            "filters": [
                {"field": "Dividend Yield Annual %", "operator": "gte", "value": 3},
                {"field": "ROE Annual %", "operator": "gte", "value": 12},
                {"field": "Debt to Equity Ratio", "operator": "lt", "value": 0.8},
                {"field": "Current Ratio", "operator": "gt", "value": 1.5},
                {
                    "field": "Market Capitalization",
                    "operator": "gt",
                    "value": 10000000000,
                },
            ],
            "sort": {"field": "Dividend Yield Annual %", "order": "desc"},
        }

    @staticmethod
    def quality_stocks() -> Dict:
        """Quality Strategy - High quality fundamentals"""
        return {
            "name": "Quality Stocks",
            "description": "Strong fundamentals across all metrics",
            "filters": [
                {"field": "ROE Annual %", "operator": "gte", "value": 20},
                {"field": "RoA Annual %", "operator": "gte", "value": 10},
                {
                    "field": "Operating Profit Margin Qtr %",
                    "operator": "gte",
                    "value": 15,
                },
                {"field": "Debt to Equity Ratio", "operator": "lt", "value": 0.5},
                {"field": "Current Ratio", "operator": "gt", "value": 2},
                {"field": "Promoter holding latest %", "operator": "gte", "value": 50},
            ],
            "sort": {"field": "ROE Annual %", "order": "desc"},
        }

    @staticmethod
    def undervalued_growth() -> Dict:
        """GARP Strategy - Growth at Reasonable Price"""
        return {
            "name": "Undervalued Growth (GARP)",
            "description": "Growth stocks trading at reasonable valuations",
            "filters": [
                {
                    "field": "Revenue Growth Annual YoY %",
                    "operator": "gte",
                    "value": 15,
                },
                {"field": "PE TTM Price to Earnings", "operator": "lt", "value": 25},
                {"field": "PE TTM Price to Earnings", "operator": "gt", "value": 0},
                {"field": "ROE Annual %", "operator": "gte", "value": 15},
                {"field": "PEG TTM PE to Growth", "operator": "lt", "value": 1.5},
            ],
            "sort": {"field": "PEG TTM PE to Growth", "order": "asc"},
        }

    @staticmethod
    def breakout_stocks() -> Dict:
        """Breakout Strategy - Technical breakouts"""
        return {
            "name": "Breakout Stocks",
            "description": "Stocks breaking out with strong technicals",
            "filters": [
                {"field": "Day RSI", "operator": "between", "value": [50, 75]},
                {"field": "Day change %", "operator": "gt", "value": 2},
                {"field": "Month Change %", "operator": "gt", "value": 8},
                {"field": "Day ADX", "operator": "gt", "value": 25},
                {
                    "field": "Market Capitalization",
                    "operator": "gt",
                    "value": 5000000000,
                },
            ],
            "sort": {"field": "Day change %", "order": "desc"},
        }

    @staticmethod
    def low_volatility() -> Dict:
        """Low Volatility Strategy - Stable stocks"""
        return {
            "name": "Low Volatility",
            "description": "Low beta, stable price movement",
            "filters": [
                {"field": "Beta 1Year", "operator": "lt", "value": 0.8},
                {"field": "ROE Annual %", "operator": "gte", "value": 12},
                {"field": "Debt to Equity Ratio", "operator": "lt", "value": 0.7},
                {
                    "field": "Market Capitalization",
                    "operator": "gt",
                    "value": 10000000000,
                },
                {"field": "Dividend Yield Annual %", "operator": "gte", "value": 1.5},
            ],
            "sort": {"field": "Beta 1Year", "order": "asc"},
        }

    @staticmethod
    def all_presets() -> Dict[str, Dict]:
        """Get all preset strategies"""
        return {
            "value": ScreenerPresets.value_investing(),
            "growth": ScreenerPresets.growth_stocks(),
            "momentum": ScreenerPresets.momentum_trading(),
            "dividend": ScreenerPresets.dividend_aristocrats(),
            "quality": ScreenerPresets.quality_stocks(),
            "garp": ScreenerPresets.undervalued_growth(),
            "breakout": ScreenerPresets.breakout_stocks(),
            "low_volatility": ScreenerPresets.low_volatility(),
        }


class DatabaseScreener:

    """
    Database-driven stock screener.

    Usage:
        screener = DatabaseScreener()
        results = screener.apply_filters(filters)
        results = screener.apply_preset("value")
    """

    # Map filter field names to database column names
    FIELD_MAPPING = {
        "Stock Name": "stock_name",
        "NSE Code": "nse_code",
        "Sector": "sector_name",
        "Industry": "industry_name",
        "Current Price": "current_price",
        "Day change %": "day_change_pct",
        "Month Change %": "month_change_pct",
        "Qtr Change %": "qtr_change_pct",
        "1Yr change %": "year_1_change_pct",
        "Market Capitalization": "market_cap",
        "PE TTM Price to Earnings": "pe_ttm",
        "Price to Book Value Adjusted": "pb_ratio",
        "PS Price to Sales": "ps_ratio",
        "PEG TTM PE to Growth": "peg_ratio",
        "ROE Annual %": "roe_annual_pct",
        "RoA Annual %": "roa_annual_pct",
        "Operating Profit Margin Qtr %": "operating_margin_pct",
        "Net Profit Margin Annual %": "net_profit_margin_pct",
        "Revenue Growth Annual YoY %": "revenue_growth_yoy_pct",
        "Net Profit Annual YoY Growth %": "profit_growth_yoy_pct",
        "EPS TTM Growth %": "eps_growth_pct",
        "Debt to Equity Ratio": "debt_to_equity",
        "Current Ratio": "current_ratio",
        "Operating Revenue Annual": "revenue_annual",
        "Operating Revenue Qtr": "revenue_qtr",
        "Net Profit Annual": "net_profit_annual",
        "Net Profit Qtr": "net_profit_qtr",
        "Day RSI": "rsi",
        "Day MACD": "macd",
        "Day ADX": "adx",
        "Beta 1Year": "beta_1yr",
        "Day SMA50": "sma_50",
        "Day SMA200": "sma_200",
        "Day EMA20": "ema_20",
        "Trendlyne Momentum Score": "momentum_score",
        "Dividend Yield Annual %": "dividend_yield_pct",
        "Promoter holding latest %": "promoter_holding_pct",
        "FII holding current Qtr %": "fii_holding_pct",
        "MF holding current Qtr %": "mf_holding_pct",
        "Data Quality Score": "data_quality_score",
    }

    # Operator mapping to SQL
    OPERATOR_SQL = {
        "gt": ">",
        "gte": ">=",
        "lt": "<",
        "lte": "<=",
        "eq": "=",
        "ne": "!=",
        "between": "BETWEEN",
        "in": "IN",
        "not_in": "NOT IN",
        "contains": "LIKE",
    }

    def __init__(self):
        self.db = db_config

    def _map_field(self, field: str) -> Optional[str]:
        """Map user-friendly field name to database column"""
        return self.FIELD_MAPPING.get(field, field.lower().replace(" ", "_"))

    def _transform_to_frontend_format(self, results: List[Dict]) -> List[Dict]:
        """
        Transform database results to frontend format.
        Converts snake_case database fields to frontend field names.
        """
        # Create reverse mapping (db_field -> frontend_field)
        reverse_mapping = {v: k for k, v in self.FIELD_MAPPING.items()}

        transformed = []
        for row in results:
            frontend_row = {}
            for db_field, value in row.items():
                # Use reverse mapping if available, otherwise convert to title case
                frontend_field = reverse_mapping.get(db_field, db_field)
                frontend_row[frontend_field] = value
            transformed.append(frontend_row)

        return transformed

    def _build_where_clause(self, filters: List[Dict]) -> tuple:
        """
        Build SQL WHERE clause from filters.
        Returns: (where_clause_string, parameters_tuple)
        """
        clauses = []
        params = []

        for f in filters:
            field = self._map_field(f["field"])
            operator = f["operator"]
            value = f["value"]

            if operator == "between":
                clauses.append(f"{field} BETWEEN ? AND ?")
                params.extend(value)
            elif operator == "in":
                placeholders = ",".join(["?" for _ in value])
                clauses.append(f"{field} IN ({placeholders})")
                params.extend(value)
            elif operator == "not_in":
                placeholders = ",".join(["?" for _ in value])
                clauses.append(f"{field} NOT IN ({placeholders})")
                params.extend(value)
            elif operator == "contains":
                clauses.append(f"{field} LIKE ?")
                params.append(f"%{value}%")
            else:
                sql_op = self.OPERATOR_SQL.get(operator, "=")
                clauses.append(f"{field} {sql_op} ?")
                params.append(value)

        return (" AND ".join(clauses), tuple(params))

    def apply_filters(
        self,
        filters: List[Dict],
        logic: str = "AND",
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        limit: Optional[int] = None,
    ) -> Dict:
        """
        Apply custom filters to screen stocks from database.

        Args:
            filters: List of filter dicts with 'field', 'operator', 'value'
            logic: 'AND' or 'OR' - how to combine filters
            sort_by: Field to sort by
            sort_order: 'asc' or 'desc'
            limit: Maximum number of results

        Returns:
            Dict with 'results' and 'metadata'
        """
        if not filters:
            filters = []

        # Build WHERE clause
        where_clause = "1=1"  # Default: select all
        params = ()

        if filters:
            where_clause, params = self._build_where_clause(filters)

            if logic == "OR":
                # Replace AND with OR
                where_clause = where_clause.replace(" AND ", " OR ")

        # Build ORDER BY clause
        order_clause = ""
        if sort_by:
            db_field = self._map_field(sort_by)
            order_clause = f"ORDER BY {db_field} {sort_order.upper()}"

        # Build LIMIT clause
        limit_clause = f"LIMIT {limit}" if limit else ""

        # Build full query
        query = f"""
            SELECT *
            FROM stocks
            WHERE {where_clause}
              AND data_quality_score >= 30
            {order_clause}
            {limit_clause}
        """

        logger.debug(f"SQL Query: {query}")
        logger.debug(f"Parameters: {params}")

        try:
            results = self.db.execute_query(query, params)

            # Transform results to frontend format
            transformed_results = self._transform_to_frontend_format(results)

            # Get total count
            count_query = f"SELECT COUNT(*) as count FROM stocks WHERE {where_clause} AND data_quality_score >= 30"
            count_result = self.db.execute_query(count_query, params, fetch_one=True)
            total_matches = count_result["count"] if count_result else 0

            # Get total stocks
            total_stocks_result = self.db.execute_query(
                "SELECT COUNT(*) as count FROM stocks WHERE data_quality_score >= 30",
                fetch_one=True,
            )
            total_stocks = total_stocks_result["count"] if total_stocks_result else 0

            return {
                "results": transformed_results,
                "metadata": {
                    "total_matches": total_matches,
                    "total_stocks": total_stocks,
                    "match_rate": f"{(total_matches / total_stocks * 100):.1f}%"
                    if total_stocks > 0
                    else "0%",
                    "filters_applied": len(filters),
                },
            }

        except Exception as e:
            logger.error(f"Error applying filters: {e}")
            return {
                "results": [],
                "metadata": {
                    "total_matches": 0,
                    "total_stocks": 0,
                    "match_rate": "0%",
                    "error": str(e),
                },
            }

    def apply_preset(self, preset_name: str) -> Dict:
        """Apply a preset screening strategy"""
        
        presets = ScreenerPresets.all_presets()

        if preset_name not in presets:
            return {
                "results": [],
                "metadata": {"error": f"Unknown preset: {preset_name}"},
            }

        preset = presets[preset_name]

        # Apply filters
        result = self.apply_filters(
            preset["filters"],
            logic="AND",
            sort_by=preset.get("sort", {}).get("field"),
            sort_order=preset.get("sort", {}).get("order", "desc"),
        )

        # Add preset info to metadata
        result["metadata"]["preset_name"] = preset["name"]
        result["metadata"]["description"] = preset["description"]

        return result

    def get_field_stats(self, field: str) -> Optional[Dict]:
        """Get statistics for a field"""
        db_field = self._map_field(field)

        query = f"""
            SELECT
                COUNT({db_field}) as count,
                MIN({db_field}) as min,
                MAX({db_field}) as max,
                AVG({db_field}) as mean
            FROM stocks
            WHERE {db_field} IS NOT NULL
              AND data_quality_score >= 30
        """

        try:
            result = self.db.execute_query(query, fetch_one=True)

            if result and result["count"] > 0:
                return {
                    "field": field,
                    "count": result["count"],
                    "min": float(result["min"]) if result["min"] is not None else None,
                    "max": float(result["max"]) if result["max"] is not None else None,
                    "mean": float(result["mean"])
                    if result["mean"] is not None
                    else None,
                }
        except Exception as e:
            logger.error(f"Error getting stats for {field}: {e}")

        return None

    def get_available_fields(self) -> List[Dict]:
        """Get list of available fields for screening"""
        # Get columns from database
        if self.db.is_production:
            # PostgreSQL
            query = """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'stocks'
            """
        else:
            # SQLite
            query = "PRAGMA table_info(stocks)"

        try:
            if self.db.is_production:
                columns = self.db.execute_query(query)
                field_names = [col["column_name"] for col in columns]
            else:
                columns = self.db.execute_query(query)
                field_names = [col["name"] for col in columns]

            # Group by category
            categories = {
                "Valuation": [
                    "pe_ttm",
                    "peg_ratio",
                    "pb_ratio",
                    "ps_ratio",
                    "market_cap",
                ],
                "Profitability": [
                    "roe_annual_pct",
                    "roa_annual_pct",
                    "operating_margin_pct",
                    "net_profit_margin_pct",
                ],
                "Growth": [
                    "revenue_growth_yoy_pct",
                    "profit_growth_yoy_pct",
                    "eps_growth_pct",
                ],
                "Liquidity": ["current_ratio", "debt_to_equity"],
                "Technical": ["rsi", "macd", "adx", "beta_1yr"],
                "Performance": [
                    "day_change_pct",
                    "month_change_pct",
                    "qtr_change_pct",
                    "year_1_change_pct",
                ],
                "Dividend": ["dividend_yield_pct"],
                "Momentum": ["momentum_score"],
                "Holdings": [
                    "promoter_holding_pct",
                    "fii_holding_pct",
                    "mf_holding_pct",
                ],
            }

            fields = []
            for category, field_list in categories.items():
                for field in field_list:
                    if field in field_names:
                        # Get reverse mapping for user-friendly name
                        user_field = next(
                            (k for k, v in self.FIELD_MAPPING.items() if v == field),
                            field,
                        )
                        stats = self.get_field_stats(user_field)

                        fields.append(
                            {
                                "field": user_field,
                                "db_field": field,
                                "category": category,
                                "stats": stats,
                            }
                        )

            return fields

        except Exception as e:
            logger.error(f"Error getting available fields: {e}")
            return []

    def get_database_stats(self) -> Dict:
        """Get overall database statistics"""
        try:
            stats = {}

            # Total stocks
            result = self.db.execute_query(
                "SELECT COUNT(*) as count FROM stocks", fetch_one=True
            )
            stats["total_stocks"] = result["count"] if result else 0

            # High quality stocks
            result = self.db.execute_query(
                "SELECT COUNT(*) as count FROM stocks WHERE data_quality_score >= 80",
                fetch_one=True,
            )
            stats["high_quality_stocks"] = result["count"] if result else 0

            # Average quality
            result = self.db.execute_query(
                "SELECT AVG(data_quality_score) as avg FROM stocks WHERE data_quality_score > 0",
                fetch_one=True,
            )
            stats["avg_quality"] = (
                round(result["avg"], 1) if result and result["avg"] else 0
            )

            # By sector
            sector_counts = self.db.execute_query("""
                SELECT sector_name, COUNT(*) as count
                FROM stocks
                WHERE sector_name IS NOT NULL
                GROUP BY sector_name
                ORDER BY count DESC
                LIMIT 10
            """)
            stats["top_sectors"] = sector_counts

            # Last update
            result = self.db.execute_query(
                "SELECT MAX(last_updated) as last_update FROM stocks", fetch_one=True
            )
            stats["last_updated"] = result["last_update"] if result else None

            return stats

        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {}


# Singleton instance
db_screener = DatabaseScreener()
