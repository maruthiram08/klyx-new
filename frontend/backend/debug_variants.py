import pandas as pd
import yfinance as yf
from services.market_data_service import market_data_service
import os
import json

OUTPUT_FILE = 'backend/nifty50_final_analysis.xlsx'

def debug():
    print("--- Debugging Reliance Variants ---")
    
    # 1. Check File
    if os.path.exists(OUTPUT_FILE):
        df = pd.read_excel(OUTPUT_FILE)
        # Look for names
        variants = ['Infra', 'Jio', 'Reliance Infra', 'Reliance Jio']
        for v in variants:
            match = df[df['Stock Name'].astype(str).str.contains(v, case=False, regex=False)]
            if not match.empty:
                print(f"\nFound match for '{v}':")
                print(match[['Stock Name', 'NSE Code', 'Current Price']].to_string())
            else:
                print(f"No match in file for '{v}'")
    
    # 2. Check Search Results
    print("\n--- Search Candidates ---")
    for term in ["Reliance Infra", "Reliance Jio", "Jio Financial"]:
        print(f"\nSearching '{term}':")
        candidates = market_data_service.search_candidates(term)
        for c in candidates[:3]: # Show top 3
            print(f"  Name: {c.get('stock_name')}")
            print(f"  NSE Code Extracted: {c.get('nse_code', 'N/A')}")
            print(f"  PDT Dis Nm: {c.get('pdt_dis_nm')}")

if __name__ == "__main__":
    debug()
