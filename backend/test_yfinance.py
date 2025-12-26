import yfinance as yf
import pandas as pd

ticker = "ADANIENT.NS"
print(f"Fetching data for {ticker}...")
try:
    stock = yf.Ticker(ticker)
    
    # Get Balance Sheet
    bs = stock.balance_sheet
    print("\n--- Balance Sheet (First 5 rows) ---")
    if not bs.empty:
        print(bs.head().to_string())
        # Check for key specific fields
        for field in ['Total Assets', 'Total Liab', 'Total Stockholder Equity', 'Current Assets', 'Current Liabilities']:
            found = [i for i in bs.index if field in i]
            print(f"Field '{field}': {found}")
    else:
        print("Balance Sheet is empty.")
        
except Exception as e:
    print(f"Error: {e}")
