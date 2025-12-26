
from Technical.NSE import NSE
from Fundamentals.MoneyControl import MoneyControl
import json
import logging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_fetch():
    symbol = "RELIANCE"
    logger.info(f"Testing data fetch for {symbol}...")
    
    # 1. Test NSE (Often blocked)
    try:
        # logger.info("1. Testing NSE OHLC...")
        # nse = NSE()
        # ohlc = nse.get_ohlc_data(symbol, 365) 
        pass
    except Exception as e:
        logger.error(f"NSE Fetch failed (Expected 403): {e}")

    # 2. Test MoneyControl Fundamentals
    try:
        logger.info("2. Testing MoneyControl Balance Sheet...")
        mc = MoneyControl()
        # Verified method name from source: get_balance_sheet_mini_statement
        
        # MC often needs specific ID. Let's try searching.
        search_res = mc.get_ticker(symbol)
        # Search returns tuple (id, obj) or similar. Let's inspect.
        logger.info(f"MC Search Result: {search_res}")
        search_id = search_res[0] if isinstance(search_res, tuple) else search_res
        
        if search_id:
            logger.info("--- Balance Sheet ---")
            balance_sheet = mc.get_balance_sheet_mini_statement(search_id)
            print(f"MoneyControl Balance Sheet (Mini):\n{balance_sheet.head(3) if balance_sheet is not None else 'None'}")
            
            logger.info("--- Profit & Loss (Income Statement) ---")
            pl = mc.get_income_mini_statement(search_id)
            print(f"P&L (Mini):\n{pl.head(3) if pl is not None else 'None'}")
            
            logger.info("--- Cash Flow ---")
            cf = mc.get_cash_flow_mini_statement(search_id)
            print(f"Cash Flow (Mini):\n{cf.head(3) if cf is not None else 'None'}")
            
            logger.info("--- Ratios ---")
            ratios = mc.get_ratios_mini_statement(search_id)
            print(f"Ratios:\n{ratios.head(3) if ratios is not None else 'None'}")

        else:
            logger.error("Could not find ID for symbol in MoneyControl")
            
    except Exception as e:
        logger.error(f"MoneyControl Fetch failed: {e}")

    # 3. Test TickerTape
    try:
        from Fundamentals.TickerTape import Tickertape # Corrected class name case
        logger.info("3. Testing Tickertape...")
        tt = Tickertape()
        
        # Test Scorecard
        scorecard = tt.get_score_card(symbol)
        print(f"Tickertape Scorecard:\n{json.dumps(scorecard, indent=2, default=str)[:500]}...") # Truncate for display
        
        # Test Peers
        peers = tt.peers_comparison(symbol, "Valuation")
        print(f"TickerTape Peers (Valuation):\n{peers.head() if peers is not None else 'None'}")
        
    except Exception as e:
        logger.error(f"Tickertape Fetch failed: {e}")

        logger.info("SUCCESS: Basic data fetch seems operational.")

    except Exception as e:
        logger.error(f"FAILURE: Error during fetch: {e}")
        # Print directory of object to guess methods if fail
        try:
            print("NSE Dir:", dir(NSE))
        except: pass

if __name__ == "__main__":
    test_fetch()
