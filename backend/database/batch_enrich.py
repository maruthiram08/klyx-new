
import os
import sys
import logging
import concurrent.futures
import time
from typing import List, Dict

# Setup path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_config import db_config
from services.multi_source_data_service import multi_source_service
from database.stock_populator import StockDataPopulator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def enrich_single_stock(stock: Dict):
    """Worker function to enrich a single stock"""
    try:
        data, quality = multi_source_service.fetch_stock_data(
            stock["nse_code"],
            required_fields=[
                "currentPrice", "marketCap", "pe_ratio", "roe", 
                "revenue", "net_income", "total_assets", "total_debt"
            ]
        )
        
        if data and quality["score"] > 0:
            return {"stock_id": stock["id"], "data": data, "quality": quality, "success": True}
        return {"stock_id": stock["id"], "success": False, "error": "No data"}
        
    except Exception as e:
        return {"stock_id": stock["id"], "success": False, "error": str(e)}

def main():
    populator = StockDataPopulator()
    
    # Get stocks needing enrichment
    logger.info("Fetching list of stocks to enrich...")
    query = """
        SELECT id, stock_name, nse_code 
        FROM stocks 
        WHERE data_quality_score < 10 
        ORDER BY market_cap DESC NULLS LAST
    """
    stocks = db_config.execute_query(query)
    
    if not stocks:
        logger.info("No stocks need enrichment.")
        return

    total_stocks = len(stocks)
    logger.info(f"Found {total_stocks} stocks to enrich. Starting parallel processing...")
    
    # Process in chunks to avoid overwhelming memory/DB
    chunk_size = 50
    max_workers = 10
    
    processed = 0
    success_count = 0
    
    for i in range(0, total_stocks, chunk_size):
        chunk = stocks[i:i + chunk_size]
        logger.info(f"Processing chunk {i//chunk_size + 1}/{(total_stocks + chunk_size - 1)//chunk_size} ({len(chunk)} stocks)...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_stock = {executor.submit(enrich_single_stock, stock): stock for stock in chunk}
            
            for future in concurrent.futures.as_completed(future_to_stock):
                result = future.result()
                processed += 1
                
                if result["success"]:
                    populator._update_stock_data(result["stock_id"], result["data"], result["quality"])
                    success_count += 1
                    print(f"✅ Enriched {result['data'].get('_ticker_used', 'Stock')} ({processed}/{total_stocks})")
                else:
                    print(f"❌ Failed ({processed}/{total_stocks}): {result.get('error')}")

        # Small pause between chunks to be nice to APIs
        time.sleep(1)

    logger.info(f"Enrichment complete! Success rate: {success_count}/{total_stocks}")

if __name__ == "__main__":
    main()
