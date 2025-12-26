from Fundamentals.TickerTape import Tickertape
import json
import logging
import inspect
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_tickertape")

def debug_tickertape():
    logger.info("Initializing Tickertape...")
    try:
        tt = Tickertape()
        
        # Locate the file
        file_loc = inspect.getfile(Tickertape)
        logger.info(f"Tickertape Class File: {file_loc}")
        
        # Print source of get_score_card to understand what it does
        # import inspect # Removed to fix scoping issue
        try:
             src = inspect.getsource(tt.get_score_card)
             logger.info(f"Source of get_score_card:\n{src}")
        except Exception as e:
             logger.error(f"Could not read source: {e}")

        symbol = "RELIANCE"
        logger.info(f"Fetching data for {symbol}...")
        
        # Try to call the internal request method if possible, or just catch the error and inspect vars?
        # Since we can't edit the file, we can't easily intercept the 'response' variable inside the method.
        # But looking at the source might reveal the URL.
        
        # Let's simple try catch and print
        try:
            scorecard = tt.get_score_card(symbol)
            if scorecard:
                 print(f"\n--- Scorecard for {symbol} ---")
                 print(json.dumps(scorecard, indent=2, default=str)[:500] + "...")
        except Exception as e:
            logger.error(f"Tickertape get_score_card failed: {e}")
             
        # Test 2: Peers
        print(f"\n--- Peers for {symbol} ---")
        try:
            peers = tt.peers_comparison(symbol, "Valuation")
            print(peers.head() if peers is not None else "None")
        except Exception as e:
            logger.error(f"Peers failed: {e}")

    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_tickertape()
