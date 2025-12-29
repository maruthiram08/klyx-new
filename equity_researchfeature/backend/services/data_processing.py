import sys
import os
from datetime import datetime, timedelta

# Add project root to path to ensure imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

from backend.database.db_config import DatabaseConfig
from backend.database.wrapper import DBWrapper
from backend.database import storage
from backend.services.analysis import FinancialAnalysisService

# Connectors
from backend.datasource.screener import fetch_screener_data
from backend.datasource.yahoo import fetch_yahoo_data
from backend.datasource.moneycontrol import fetch_moneycontrol_data

class StockDataProcessor:
    def __init__(self):
        self.db_config = DatabaseConfig()

    def process_stock(self, nse_code: str, force_refresh: bool = False) -> dict:
        """
        Main orchestration function:
        1. Check Freshness
        2. Fetch Data (if stale)
        3. Store Data
        """
        print(f"[{nse_code}] Processing...")
        
        with self.db_config.get_connection() as conn:
            # Wrap connection for PART5 compatibility
            db = DBWrapper(conn)
            
            # Step 1: Check if stock exists and is fresh
            stock = storage.get_stock_by_code(nse_code, db)
            freshness = self.check_data_freshness(stock)
            
            if not force_refresh and not freshness['needs_refresh']:
                print(f"[{nse_code}] Data is fresh. Skipping fetch.")
                return {'status': 'skipped', 'reason': 'fresh_data', 'stock_id': stock['id']}
            
            print(f"[{nse_code}] Data stale/missing. Fetching from sources...")
            
            # Step 2: Fetch Data
            # 2a. Yahoo Finance (Real-time Price & Valuations)
            yahoo_data = fetch_yahoo_data(nse_code)
            if 'error' in yahoo_data:
                print(f"[{nse_code}] Yahoo Error: {yahoo_data['error']}")
                return {'status': 'error', 'reason': f"Yahoo: {yahoo_data['error']}"}
            
            # 2b. Screener.in (Historical Financials)
            screener_data = fetch_screener_data(nse_code)
            if 'error' in screener_data:
                 print(f"[{nse_code}] Screener Error: {screener_data['error']}")
                 # Fallback logic? PART5 says "Handle errors gracefully". 
                 # If visuals are missing, we can't do much. But we might proceed with just Yahoo data?
                 # For now, strict failure if core financials missing.
                 return {'status': 'error', 'reason': f"Screener: {screener_data['error']}"}

            # 2c. MoneyControl (Shareholding/Corp Actions)
            mc_data = fetch_moneycontrol_data(nse_code)
            # Optional source, don't fail hard
            
            # Step 3: Merge Data for Storage
            # We prioritize Yahoo for Price/Market Cap, and Screener for fundamentals
            merged_data = {
                **yahoo_data,
                'sector': yahoo_data.get('sector') or 'Unknown',
                'industry': yahoo_data.get('industry') or 'Unknown',
                # Add Screener specific fields if we want to store them in 'stocks' table (e.g. scores if we calculate them later)
            }
            
            # Step 4: Store Stock Master Data
            stock_id = storage.store_stock_data(merged_data, db)
            
            # Step 5: Store Historical Financials
            if screener_data.get('profit_loss'):
                print(f"[{nse_code}] Merging and Storing Financials...")
                
                # 2d. MoneyControl Ratios (Banking/NBFC Fallback for NIM/CAR)
                # mc_data is fetched at line 65
                mc_ratios = mc_data.get('moneycontrol_ratios', [])
                
                # Merge P&L, BS, CF, Screener Ratios, and MC Ratios by fiscal_year
                merged_financials = {}
                
                # Helper to merge into dict
                def merge_list(data_list):
                    if not data_list: return
                    for item in data_list:
                        fy = item.get('fiscal_year')
                        if fy:
                            if fy not in merged_financials:
                                merged_financials[fy] = {}
                            merged_financials[fy].update(item)
                
                merge_list(screener_data.get('profit_loss'))
                merge_list(screener_data.get('balance_sheet'))
                merge_list(screener_data.get('cash_flow'))
                merge_list(screener_data.get('ratios'))
                merge_list(mc_ratios) # MoneyControl ratios override/fill gaps
                
                # Convert back to list
                final_financials_list = list(merged_financials.values())
                
                storage.store_historical_financials(stock_id, final_financials_list, db)
                
                # Run derived metrics analysis
                print(f"[{nse_code}] Computing Derived Metrics...")
                analyzer = FinancialAnalysisService(db)
                analyzer.analyze_stock_financials(stock_id)
                
            print(f"[{nse_code}] Update Complete.")
            return {'status': 'success', 'stock_id': stock_id}

    def check_data_freshness(self, stock: dict) -> dict:
        """
        Determine if we need to fetch new data.
        Rule: Price < 24h old, Fundamentals < 7 days old.
        """
        if not stock:
            return {'needs_refresh': True, 'reason': 'new_stock'}
            
        now = datetime.now()
        
        # Price Check (24h)
        last_price = stock.get('last_price_update')
        if not last_price or (now - last_price).total_seconds() > 86400: # 24h
            return {'needs_refresh': True, 'reason': 'stale_price'}
            
        # Fundamental Check (7 days) (Using updated_at as proxy if last_fundamental_update missing)
        # Note: The schema has 'last_fundamental_update' but PART5 storage function updates 'updated_at'.
        # We'll use updated_at for now.
        last_update = stock.get('updated_at')
        if not last_update or (now - last_update).days > 7:
            return {'needs_refresh': True, 'reason': 'stale_fundamentals'}
            
        return {'needs_refresh': False}
