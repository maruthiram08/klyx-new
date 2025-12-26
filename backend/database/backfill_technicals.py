
import os
import sys
import logging
import concurrent.futures
import time
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime

# Setup path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_config import db_config
from services.momentum_calculator import MomentumCalculator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def process_single_stock(stock):
    try:
        symbol = stock['nse_code']
        # Use .NS suffix logic
        ticker = f"{symbol}.NS"
        
        # Fetch history (fast)
        dat = yf.download(ticker, period="1y", progress=False)
        
        if dat.empty or len(dat) < 50:
            return None
            
        # Handle MultiIndex columns if present (yfinance update)
        if isinstance(dat.columns, pd.MultiIndex):
            dat.columns = dat.columns.get_level_values(0)
            
        # Calculate Indicators
        close = dat['Close']
        
        # RSI
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        current_rsi = rsi.iloc[-1]
        
        # SMAs
        sma_50 = close.rolling(window=50).mean().iloc[-1]
        sma_200 = close.rolling(window=200).mean().iloc[-1] if len(close) > 200 else 0
        
        # Prepare data for MomentumCalculator
        calc_data = {
            "rsi": current_rsi,
            "currentPrice": close.iloc[-1],
            "sma_50": sma_50,
            "sma_200": sma_200,
            "dayChange": stock.get('day_change_pct', 0), # Fallback to DB
            "week52High": stock.get('week_52_high', 0)   # Fallback to DB
        }
        
        score = MomentumCalculator.calculate(calc_data)
        
        return {
            "id": stock['id'],
            "rsi": float(current_rsi) if not pd.isna(current_rsi) else None,
            "sma_50": float(sma_50) if not pd.isna(sma_50) else None,
            "sma_200": float(sma_200) if not pd.isna(sma_200) else None,
            "momentum_score": score
        }
        
    except Exception as e:
        # logger.error(f"Failed {stock['nse_code']}: {e}")
        return None

def main():
    logger.info("🚀 Starting Technicals Backfill...")
    
    # Get stocks
    # process only those with missing RSI or missing momentum
    stocks = db_config.execute_query("SELECT id, nse_code, day_change_pct FROM stocks WHERE momentum_score IS NULL OR momentum_score = 0 ORDER BY market_cap DESC")
    
    if not stocks:
        logger.info("No stocks need technicals backfill.")
        return

    total = len(stocks)
    logger.info(f"Processing {total} stocks...")
    
    updated_count = 0
    
    # Process in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_single_stock, stock): stock for stock in stocks}
        
        completed = 0
        for future in concurrent.futures.as_completed(futures):
            completed += 1
            res = future.result()
            if res:
                # Update DB
                db_config.execute_query(
                    """UPDATE stocks SET 
                       rsi = ?, 
                       sma_50 = ?, 
                       sma_200 = ?, 
                       momentum_score = ?,
                       last_updated = datetime('now')
                       WHERE id = ?""",
                    (res['rsi'], res['sma_50'], res['sma_200'], res['momentum_score'], res['id'])
                )
                updated_count += 1
                if updated_count % 50 == 0:
                    logger.info(f"Updated {updated_count}/{total} stocks... ({completed} processed)")
            
            if completed % 100 == 0:
                print(f"Progress: {completed}/{total}")

    logger.info(f"✅ Backfill Complete! Updated {updated_count} stocks.")

if __name__ == "__main__":
    main()
