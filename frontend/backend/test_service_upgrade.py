from services.market_data_service import market_data_service
import json

def test_service():
    symbol = "RELIANCE"
    print(f"Fetching fundamentals for {symbol} via MarketDataService...")
    
    data = market_data_service.get_fundamentals(symbol)
    
    if "error" in data:
        print(f"Error: {data['error']}")
        return

    # Check Balance Sheet
    bs = data.get('balance_sheet', [])
    print(f"\nBalance Sheet Records: {len(bs)}")
    if bs:
        # Print columns from first record (keys)
        # We expect ~11 keys (Metric + 10 years) instead of 6
        keys = list(bs[0].keys())
        print(f"Balance Sheet Columns ({len(keys)}): {keys}")
        
        # Verify 10 years check
        # Typical keys are 'headers', 'Mar 2024', etc.
        year_cols = [k for k in keys if k != 'headers']
        print(f"Years found: {len(year_cols)}")
        if len(year_cols) >= 9:
            print("SUCCESS: Retrieved approx 10 years of data.")
        else:
            print(f"WARNING: Only retrieved {len(year_cols)} years.")

    # Check P&L
    pl = data.get('profit_loss', [])
    print(f"\nP&L Records: {len(pl)}")
    if pl:
        print(f"P&L Columns: {list(pl[0].keys())}")

    # Check Cash Flow
    cf = data.get('cash_flow', [])
    print(f"\nCash Flow Records: {len(cf)}")
    
    # Check Ratios
    ratios = data.get('ratios', [])
    print(f"\nRatios Records: {len(ratios)}")

if __name__ == "__main__":
    test_service()
