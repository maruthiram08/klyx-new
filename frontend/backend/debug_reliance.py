import pandas as pd
import yfinance as yf
import os

OUTPUT_FILE = 'backend/nifty50_final_analysis.xlsx'

def debug():
    print("--- Debugging Reliance Data ---")
    
    # 1. Check generated file
    if os.path.exists(OUTPUT_FILE):
        df = pd.read_excel(OUTPUT_FILE)
        
        # Try finding by NSE Code
        rel = df[df['NSE Code'] == 'RELIANCE']
        if not rel.empty:
            print("\nFound RELIANCE in Final File:")
            print(rel[['NSE Code', 'Current Price', 'Market Capitalization', 'ROE Annual %', 'PE TTM Price to Earnings']].to_string())
        else:
            print("\nRELIANCE NOT FOUND in Final File via NSE Code.")
            
            # Try by Name
            rel_name = df[df['Stock Name'].astype(str).str.contains('Reliance', case=False)]
            if not rel_name.empty:
                print(f"Found by Name: {rel_name['Stock Name'].values}")
                print(rel_name[['NSE Code', 'Current Price', 'Market Capitalization']].to_string())
            else:
                print("RELIANCE NOT FOUND by Name either.")
    else:
        print(f"File {OUTPUT_FILE} does not exist.")

    # 2. Test Fetching
    print("\n--- Testing YFinance Fetch ---")
    ticker = "RELIANCE.NS"
    print(f"Fetching {ticker}...")
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        print("Success!")
        print(f"Current Price: {info.get('currentPrice')}")
        print(f"Market Cap: {info.get('marketCap')}")
        print(f"Trailing PE: {info.get('trailingPE')}")
    except Exception as e:
        print(f"Fetch Failed: {e}")

if __name__ == "__main__":
    debug()
