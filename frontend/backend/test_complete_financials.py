from Fundamentals.MoneyControl import MoneyControl
import pandas as pd

def test_complete_methods():
    mc = MoneyControl()
    # RELIANCE ID
    ticker_data = mc.get_ticker("RELIANCE")
    print(f"Debug: get_ticker returned type {type(ticker_data)}")
    print(f"Debug: get_ticker[0] = {ticker_data[0]}")
    if len(ticker_data) > 1:
        print(f"Debug: get_ticker[1] (first item) = {ticker_data[1][0] if ticker_data[1] else 'Empty list'}")

    # Inspect the data to find the URL
    details = ticker_data[1][0] if len(ticker_data) > 1 and ticker_data[1] else {}
    mc_url = details.get('stock_url') # Guessing key name, will verify in output
    if not mc_url:
        # Fallback inspection
        print("Could not find 'stock_url' in details. Keys are:", details.keys())
        mc_url = details.get('link_src') or details.get('url') # Try other common keys

    if not mc_url:
        print("Failed to resolve URL. Exiting.")
        return

    print(f"Testing Complete Methods for RELIANCE (URL: {mc_url})")

    # 1. Complete Balance Sheet (10 Years)
    print("\n--- Complete Balance Sheet (10 Years - First 5 cols) ---")
    try:
        bs = mc.get_complete_balance_sheet(mc_url, num_years=10)
        print(bs.iloc[:, :].head() if bs is not None else "None")
        print(f"Columns: {bs.columns.tolist() if bs is not None else 'None'}")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Complete P&L
    print("\n--- Complete P&L (First 5 cols) ---")
    try:
        pl = mc.get_complete_profit_loss(mc_url)
        print(pl.iloc[:, :5].head() if pl is not None else "None")
    except Exception as e:
        print(f"Error: {e}")

    # 3. Complete Quarterly Results
    print("\n--- Complete Quarterly Results (First 5 cols) ---")
    try:
        qtr = mc.get_complete_quarterly_results(mc_url)
        print(qtr.iloc[:, :5].head() if qtr is not None else "None")
    except Exception as e:
        print(f"Error: {e}")

    # 4. Capital Structure
    print("\n--- Capital Structure ---")
    try:
        cap = mc.get_complete_capital_structure_statement(mc_url)
        print(cap.head() if cap is not None else "None")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_complete_methods()
