import yfinance as yf
import pandas as pd

tickers = ["RELIANCE.NS", "TCS.NS"]
print("Fetching shareholding data...")

for t in tickers:
    print(f"\n--- {t} ---")
    try:
        stock = yf.Ticker(t)
        
        # 1. Major Holders (Often gives Insiders %)
        print("Major Holders:")
        print(stock.major_holders)
        
        # 2. Institutional Holders
        print("\nInstitutional Holders:")
        print(stock.institutional_holders)
        
        # 3. Mutual Fund Holders
        print("\nMutual Fund Holders:")
        print(stock.mutualfund_holders)
        
        # 4. Insider Roster (Sometimes useful)
        # print(stock.insider_roster_holders)
        
    except Exception as e:
        print(f"Error: {e}")
