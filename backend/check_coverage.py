
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db_config import db_config

def check_coverage():
    print("Checking Metric Coverage...")

    queries = {
        "Total Stocks": "SELECT COUNT(*) as c FROM stocks",
        "Durability Score": "SELECT COUNT(*) as c FROM stocks WHERE durability_score IS NOT NULL",
        "Valuation Score": "SELECT COUNT(*) as c FROM stocks WHERE valuation_score IS NOT NULL",
        "Magic Formula (ROCE)": "SELECT COUNT(*) as c FROM stocks WHERE roce_annual_pct IS NOT NULL",
        "Magic Formula (Earn Yld)": "SELECT COUNT(*) as c FROM stocks WHERE earnings_yield_pct IS NOT NULL",
        "Relative Strength": "SELECT COUNT(*) as c FROM stocks WHERE rel_strength_score IS NOT NULL",
        "Momentum Score": "SELECT COUNT(*) as c FROM stocks WHERE momentum_score IS NOT NULL",
        "Target Price": "SELECT COUNT(*) as c FROM stocks WHERE target_price IS NOT NULL",
        "1-Year Change (Source for RS)": "SELECT COUNT(*) as c FROM stocks WHERE year_1_change_pct IS NOT NULL"
    }

    for label, query in queries.items():
        try:
            res = db_config.execute_query(query, fetch_one=True)
            print(f"{label}: {res['c']}")
        except Exception as e:
            print(f"{label}: Error - {e}")

if __name__ == "__main__":
    check_coverage()
