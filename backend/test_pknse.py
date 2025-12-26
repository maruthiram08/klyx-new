import logging
import json
import sys

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_pknse")

def test_pknse_fetch():
    logger.info("Importing PKNSETools...")
    try:
        # Based on repo structure, let's guess the import. usually it is PKNSETools
        import PKNSETools
        # Or maybe it exposes a specific class
        from PKNSETools.PKNSEStockDataFetcher import PKNSEStockDataFetcher
        
        logger.info("PKNSETools imported successfully.")
        
        symbol = "RELIANCE"
        logger.info(f"Fetching data for {symbol}...")
        
        fetcher = PKNSEStockDataFetcher()
        # Check methods
        # logger.info(f"Fetcher methods: {dir(fetcher)}")
        
        # Try fetching data
        data = fetcher.fetch_stock_data(symbol)
        
        if data:
             print(f"\n--- Data for {symbol} ---")
             print(str(data)[:1000]) # Print first 1000 chars
        else:
             print("No data returned.")
             
    except ImportError:
         logger.error("Could not import PKNSETools. Is it installed?")
    except Exception as e:
         logger.error(f"Error: {e}")
         import traceback
         traceback.print_exc()

if __name__ == "__main__":
    test_pknse_fetch()
