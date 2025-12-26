import pandas as pd
import os
import logging
from services.market_data_service import market_data_service

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'datasource')

def get_user_files():
    files = []
    if os.path.exists(DATA_DIR):
        for f in os.listdir(DATA_DIR):
            if f.endswith(('.xlsx', '.csv')) and not f.startswith(('~$', '.', 'test_', 'nifty50_')):
                 files.append(os.path.join(DATA_DIR, f))
    return files

def verify_files():
    files = get_user_files()
    if not files:
        return {"status": "no_files", "valid": [], "invalid": []}

    invalid_items = []
    processed_symbols = set()
    valid_symbols = set()
    
    # We only care about unique identifiers across all files
    
    for file_path in files:
        try:
            df = pd.read_excel(file_path) if file_path.endswith('.xlsx') else pd.read_csv(file_path)
            
            # Check for generic columns
            cols = df.columns
            symbol_col = None
            if 'NSE Code' in cols: symbol_col = 'NSE Code'
            elif 'Stock Name' in cols: symbol_col = 'Stock Name'
            elif 'Symbol' in cols: symbol_col = 'Symbol'
            
            if symbol_col:
                symbols = df[symbol_col].dropna().astype(str).unique()
                for sym in symbols:
                    if sym in processed_symbols:
                        continue
                    processed_symbols.add(sym)
                        
                    # Validate
                    mc_id = market_data_service.get_moneycontrol_id(sym)
                    if mc_id:
                        valid_symbols.add(sym)
                    else:
                        # Fetch suggestions
                        candidates = market_data_service.search_candidates(sym)
                        invalid_items.append({
                            "symbol": sym,
                            "candidates": candidates
                        })
                        
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")

    return {
        "status": "success",
        "valid": list(valid_symbols),
        "invalid": invalid_items
    }

def apply_corrections(corrections):
    """
    corrections: dict { "BadSymbol": "GoodSymbol" }
    """
    files = get_user_files()
    affected_count = 0
    
    for file_path in files:
        try:
            is_excel = file_path.endswith('.xlsx')
            df = pd.read_excel(file_path) if is_excel else pd.read_csv(file_path)
            modified = False
            
            # Identify columns to replace
            target_cols = ['NSE Code', 'Stock Name', 'Symbol']
            cols_present = [c for c in target_cols if c in df.columns]
            
            for col in cols_present:
                # Check if any values in this column need replacement
                if df[col].astype(str).isin(corrections.keys()).any():
                    df[col] = df[col].replace(corrections)
                    modified = True
            
            if modified:
                if is_excel:
                    df.to_excel(file_path, index=False)
                else:
                    df.to_csv(file_path, index=False)
                affected_count += 1
                
        except Exception as e:
            logger.error(f"Error updating {file_path}: {e}")
            raise e
            
    return affected_count
