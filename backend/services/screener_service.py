"""
Stock Screener Service - Advanced filtering and screening engine.

Supports:
- Multiple filter criteria
- Custom operators (>, <, =, between, etc.)
- Logical combinations (AND, OR)
- Preset screening strategies
- Sorting and ranking
- Export functionality
"""

import logging
import operator
from typing import Any, Callable, Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class FilterOperator:
    """Supported filter operators"""

    OPERATORS = {
        "gt": operator.gt,  # >
        "gte": operator.ge,  # >=
        "lt": operator.lt,  # <
        "lte": operator.le,  # <=
        "eq": operator.eq,  # =
        "ne": operator.ne,  # !=
        "between": lambda x, y: y[0] <= x <= y[1],
        "in": lambda x, y: x in y,
        "not_in": lambda x, y: x not in y,
        "contains": lambda x, y: str(y).lower() in str(x).lower(),
        "top": lambda x, y: True,  # Special: handled separately
        "bottom": lambda x, y: True,  # Special: handled separately
    }

    @classmethod
    def apply(cls, value: Any, operator_name: str, target: Any) -> bool:
        """Apply operator to value"""
        if pd.isna(value):
            return False

        op_func = cls.OPERATORS.get(operator_name)
        if not op_func:
            raise ValueError(f"Unknown operator: {operator_name}")

        try:
            return op_func(value, target)
        except Exception as e:
            logger.debug(
                f"Filter failed for value={value}, op={operator_name}, target={target}: {e}"
            )
            return False


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


class ScreenerService:
    """
    Main screener service for filtering and ranking stocks.

    Usage:
        screener = ScreenerService(stocks_df)
        results = screener.apply_filters(filters)
        results = screener.apply_preset("value")
    """

    def __init__(self, data: pd.DataFrame):
        """Initialize with stock data"""
        self.data = data.copy()
        self.original_count = len(data)

    def apply_filter(self, field: str, operator_name: str, value: Any) -> pd.DataFrame:
        """Apply a single filter to the dataset"""
        if field not in self.data.columns:
            logger.warning(f"Field '{field}' not found in data")
            return self.data

        # Handle special operators
        if operator_name in ["top", "bottom"]:
            return self._apply_ranking_filter(field, operator_name, value)

        # Apply standard filter
        mask = self.data[field].apply(
            lambda x: FilterOperator.apply(x, operator_name, value)
        )

        return self.data[mask]

    def _apply_ranking_filter(
        self, field: str, operator_name: str, n: int
    ) -> pd.DataFrame:
        """Apply top/bottom N ranking filter"""
        sorted_df = self.data.sort_values(
            by=field, ascending=(operator_name == "bottom")
        )
        return sorted_df.head(n)

    def apply_filters(self, filters: List[Dict], logic: str = "AND") -> pd.DataFrame:
        """
        Apply multiple filters with AND/OR logic.

        Args:
            filters: List of filter dicts with 'field', 'operator', 'value'
            logic: 'AND' or 'OR' - how to combine filters

        Returns:
            Filtered DataFrame
        """
        if not filters:
            return self.data

        if logic == "AND":
            # Apply filters sequentially (intersection)
            result = self.data.copy()
            for f in filters:
                screener = ScreenerService(result)
                result = screener.apply_filter(f["field"], f["operator"], f["value"])
            return result

        elif logic == "OR":
            # Apply filters separately and combine (union)
            results = []
            for f in filters:
                screener = ScreenerService(self.data)
                filtered = screener.apply_filter(f["field"], f["operator"], f["value"])
                results.append(filtered)

            # Combine and remove duplicates
            if results:
                combined = pd.concat(results).drop_duplicates()
                return combined
            return pd.DataFrame()

        else:
            raise ValueError(f"Unknown logic: {logic}. Use 'AND' or 'OR'")

    def apply_preset(self, preset_name: str) -> Dict:
        """
        Apply a preset screening strategy.

        Returns:
            Dict with 'results' DataFrame and 'metadata'
        """
        presets = ScreenerPresets.all_presets()

        if preset_name not in presets:
            raise ValueError(
                f"Unknown preset: {preset_name}. Available: {list(presets.keys())}"
            )

        preset = presets[preset_name]

        # Apply filters
        filtered = self.apply_filters(preset["filters"], logic="AND")

        # Apply sorting
        if "sort" in preset and not filtered.empty:
            sort_field = preset["sort"]["field"]
            sort_order = preset["sort"].get("order", "desc") == "asc"

            if sort_field in filtered.columns:
                filtered = filtered.sort_values(by=sort_field, ascending=sort_order)

        return {
            "results": filtered,
            "metadata": {
                "preset_name": preset["name"],
                "description": preset["description"],
                "total_matches": len(filtered),
                "total_stocks": self.original_count,
                "match_rate": f"{(len(filtered) / self.original_count * 100):.1f}%"
                if self.original_count > 0
                else "0%",
            },
        }

    def sort_results(
        self, data: pd.DataFrame, sort_by: str, ascending: bool = False
    ) -> pd.DataFrame:
        """Sort results by a field"""
        if sort_by not in data.columns:
            logger.warning(f"Sort field '{sort_by}' not found")
            return data

        return data.sort_values(by=sort_by, ascending=ascending, na_position="last")

    def get_field_stats(self, field: str) -> Dict:
        """Get statistics for a field (min, max, mean, median)"""
        if field not in self.data.columns:
            return {}

        series = self.data[field].dropna()

        if len(series) == 0:
            return {}

        return {
            "field": field,
            "count": len(series),
            "min": float(series.min()),
            "max": float(series.max()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "std": float(series.std()) if len(series) > 1 else 0,
        }

    def get_available_fields(self) -> List[Dict]:
        """Get list of all available fields for screening"""
        fields = []

        # Group fields by category
        categories = {
            "Valuation": [
                "PE TTM Price to Earnings",
                "PEG TTM PE to Growth",
                "Price to Book Value Adjusted",
                "Market Capitalization",
            ],
            "Profitability": [
                "ROE Annual %",
                "RoA Annual %",
                "Operating Profit Margin Qtr %",
                "Net Profit Annual YoY Growth %",
            ],
            "Growth": [
                "Revenue Growth Annual YoY %",
                "Net Profit Annual YoY Growth %",
                "EPS TTM Growth %",
            ],
            "Liquidity": ["Current Ratio", "Debt to Equity Ratio"],
            "Technical": ["Day RSI", "Day MACD", "Day ADX", "Beta 1Year", "Day MFI"],
            "Performance": [
                "Day change %",
                "Month Change %",
                "Qtr Change %",
                "1Yr change %",
            ],
            "Dividend": ["Dividend Yield Annual %"],
            "Momentum": [
                "Trendlyne Momentum Score",
                "Relative returns vs Nifty50 week%",
            ],
            "Holdings": [
                "Promoter holding latest %",
                "FII holding current Qtr %",
                "MF holding current Qtr %",
            ],
        }

        for category, field_list in categories.items():
            for field in field_list:
                if field in self.data.columns:
                    stats = self.get_field_stats(field)
                    fields.append(
                        {"field": field, "category": category, "stats": stats}
                    )

        return fields


# Singleton helper function
def create_screener(
    data_file: str = "nifty50_final_analysis.xlsx",
) -> Optional[ScreenerService]:
    """Create a screener instance from data file"""
    try:
        import os

        if not os.path.exists(data_file):
            logger.error(f"Data file not found: {data_file}")
            return None

        df = pd.read_excel(data_file)
        return ScreenerService(df)

    except Exception as e:
        logger.error(f"Failed to create screener: {e}")
        return None
