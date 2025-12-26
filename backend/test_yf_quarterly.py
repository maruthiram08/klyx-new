import yfinance as yf
import pandas as pd

def test_yf_quarterly():
    ticker = "RELIANCE.NS"
    print(f"Fetching Quarterly Data for {ticker} via yfinance...")
    
    stock = yf.Ticker(ticker)
    try:
        q_income = stock.quarterly_income_stmt
        if not q_income.empty:
            print("\n--- Quarterly Income Statement Columns ---")
            print(q_income.columns)
            print("\n--- Detailed Rows (First 10) ---")
            print(q_income.head(10))
            
            # extract Total Revenue
            if "Total Revenue" in q_income.index:
                print(f"\nTotal Revenue (Latest Q): {q_income.loc['Total Revenue'].iloc[0]}")
            
            if "Net Income" in q_income.index:
                print(f"Net Income (Latest Q): {q_income.loc['Net Income'].iloc[0]}")
                
        else:
            print("Quarterly Income Statement is empty.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_yf_quarterly()
