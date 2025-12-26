from services.market_data_service import market_data_service
from Fundamentals.MoneyControl import MoneyControl
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)

def test_consolidated():
    symbol = "RELIANCE"
    mc = MoneyControl()
    
    # Get URL first
    details = market_data_service.get_moneycontrol_details(symbol)
    if not details:
        print("Failed to get details")
        return
        
    url = details['url']
    print(f"Testing Consolidated Fetch for {symbol} (URL: {url})")

    # 1. Consolidated P&L
    print("\n--- Consolidated Profit & Loss (First 5 cols) ---")
    try:
        # Check if argument is supported by trying it
        pl = mc.get_complete_profit_loss(url, statement_type='consolidated', num_years=5)
        print(pl.iloc[:, :5].head() if pl is not None else "None")
        
        # Verify content - key word
        if pl is not None:
             # Just checking if headers change or values look bigger than standalone
             pass
    except Exception as e:
        print(f"Error fetching Consolidated PL: {e}")

    # 2. Consolidated Balance Sheet
    print("\n--- Consolidated Balance Sheet (First 5 cols) ---")
    try:
        bs = mc.get_complete_balance_sheet(url, statement_type='consolidated', num_years=5)
        print(bs.iloc[:, :5].head() if bs is not None else "None")
    except Exception as e:
        print(f"Error fetching Consolidated BS: {e}")

if __name__ == "__main__":
    test_consolidated()
