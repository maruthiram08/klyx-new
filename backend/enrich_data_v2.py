"""
Enhanced Data Enrichment with Multi-Source Fallback Strategy.

This version uses the MultiSourceDataService for reliable data fetching.
"""

import logging
import os

import numpy as np
import pandas as pd
from services.multi_source_data_service import multi_source_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

backend_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(backend_dir, 'nifty50_unified_master.xlsx')
output_file = os.path.join(backend_dir, 'nifty50_enriched.xlsx')

# Column mappings from multi-source data to Excel columns
COLUMN_MAPPINGS = {
    # Price metrics
    "currentPrice": "Current Price",
    "marketCap": "Market Capitalization",
    # Valuation ratios
    "pe_ratio": "PE TTM Price to Earnings",
    "pb_ratio": "PB Price to Book Value",
    "ps_ratio": "PS Price to Sales",
    # Profitability
    "roe": "ROE Annual %",
    "roa": "ROA Annual %",
    "profit_margin": "Net Profit Margin Annual %",
    "operating_margin": "Operating Profit Margin Annual %",
    # Revenue & Profit
    "revenue": "Operating Revenue Annual",
    "net_income": "Net Profit Annual",
    # Balance Sheet
    "total_assets": "YF_TotalAssets",
    "current_assets": "YF_CurrentAssets",
    "total_debt": "YF_TotalDebt",
    "current_liabilities": "YF_CurrentLiabilities",
    "stockholders_equity": "YF_StockholdersEquity",
    # Quarterly
    "quarterly_revenue": "Operating Revenue Qtr",
    "quarterly_net_income": "Net Profit Qtr",
    # Shareholding
    "promoter_holding": "Promoter holding latest %",
    "institutional_holding": "Institutional holding current Qtr %",
}


def main():
    if not os.path.exists(input_file):
        print(f"{input_file} not found.")
        return

    print(f"Reading {input_file}...")
    df = pd.read_excel(input_file)

    # Initialize all required columns
    for excel_col in COLUMN_MAPPINGS.values():
        if excel_col not in df.columns:
            df[excel_col] = np.nan

    # Add quality tracking columns
    if "Data Quality Score" not in df.columns:
        df["Data Quality Score"] = np.nan
    if "Data Sources" not in df.columns:
        df["Data Sources"] = ""
    if "Last Updated" not in df.columns:
        df["Last Updated"] = ""

    print(f"\nEnriching {len(df)} stocks using multi-source strategy...")
    print("=" * 80)

    # Prepare symbols list
    symbols_to_fetch = []
    symbol_to_index = {}

    for i, row in df.iterrows():
        ticker_name = str(row.get("Stock Name", "")).strip()
        nse_code = str(row.get("NSE Code", ""))

        # Use NSE Code if available, otherwise use Stock Name
        symbol = nse_code if (nse_code and nse_code != "nan") else ticker_name

        if symbol and symbol != "nan":
            symbols_to_fetch.append(symbol)
            symbol_to_index[symbol] = i

    print(f"Fetching data for {len(symbols_to_fetch)} symbols...\n")

    # Define required fields for quality scoring
    required_fields = [
        "currentPrice",
        "marketCap",
        "pe_ratio",
        "roe",
        "revenue",
        "net_income",
        "total_assets",
        "total_debt",
        "quarterly_revenue",
        "quarterly_net_income",
    ]

    # Fetch all symbols (with built-in rate limiting and retries)
    results = multi_source_service.fetch_multiple_stocks(
        symbols_to_fetch, required_fields
    )

    # Process results and update DataFrame
    for symbol, result in results.items():
        i = symbol_to_index[symbol]
        data = result["data"]
        quality = result["quality"]

        if data:
            # Map multi-source data to Excel columns
            for api_field, excel_col in COLUMN_MAPPINGS.items():
                if api_field in data and data[api_field] is not None:
                    value = data[api_field]

                    # Special handling for percentages (ROE, ROA, margins)
                    if api_field in [
                        "roe",
                        "roa",
                        "profit_margin",
                        "operating_margin",
                        "promoter_holding",
                        "institutional_holding",
                    ]:
                        # If value is decimal (0.15), convert to percentage (15)
                        if isinstance(value, (int, float)) and 0 <= value <= 1:
                            value = value * 100

                    # Only update if current value is missing or zero
                    current_val = df.at[i, excel_col]
                    if pd.isnull(current_val) or current_val == 0:
                        df.at[i, excel_col] = value

            # Update quality metadata
            df.at[i, "Data Quality Score"] = quality["score"]
            df.at[i, "Data Sources"] = ", ".join(quality.get("sources_used", []))
            df.at[i, "Last Updated"] = data.get("_last_updated", "")

            # Print summary
            ticker_name = df.at[i, "Stock Name"]
            sources = quality.get("sources_used", [])
            print(
                f"✓ {ticker_name:30} | Quality: {quality['score']:3}% | Sources: {', '.join(sources)}"
            )

            if quality["missing_fields"]:
                print(f"  Missing: {', '.join(quality['missing_fields'][:5])}")
        else:
            print(f"✗ {df.at[i, 'Stock Name']:30} | Failed to fetch data")
            df.at[i, "Data Quality Score"] = 0

    print("\n" + "=" * 80)
    print(f"Saving enriched data to {output_file}...")
    df.to_excel(output_file, index=False)

    # Print summary statistics
    avg_quality = df["Data Quality Score"].mean()
    high_quality = len(df[df["Data Quality Score"] >= 80])
    medium_quality = len(
        df[(df["Data Quality Score"] >= 50) & (df["Data Quality Score"] < 80)]
    )
    low_quality = len(df[df["Data Quality Score"] < 50])

    print("\n📊 Enrichment Summary:")
    print(f"   Average Quality Score: {avg_quality:.1f}%")
    print(f"   High Quality (≥80%):   {high_quality} stocks")
    print(f"   Medium Quality (50-79%): {medium_quality} stocks")
    print(f"   Low Quality (<50%):    {low_quality} stocks")
    print("\n✅ Enrichment Complete!")

    print("\n✅ Enrichment Complete!")

if __name__ == "__main__":
    main()
