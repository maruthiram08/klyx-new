
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def load_env_file(filepath):
    """Manually load .env file into os.environ"""
    if not os.path.exists(filepath):
        return
    print(f"Loading env from {filepath}...")
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'): continue
            if '=' in line:
                key, val = line.split('=', 1)
                val = val.strip().strip('"').strip("'")
                os.environ[key.strip()] = val

# Try loading .env.local and .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(backend_dir)

load_env_file(os.path.join(backend_dir, '.env'))
load_env_file(os.path.join(backend_dir, '.env.local'))
load_env_file(os.path.join(root_dir, '.env.local'))

# Verify DB Config
if not os.environ.get('POSTGRES_URL'):
    print("WARNING: POSTGRES_URL not found. Using SQLite if configured.")

from database.stock_populator import StockDataPopulator

def main():
    print("--- Starting Full Database Population ---")
    populator = StockDataPopulator()
    
    # 1. Update basic stock list first (fast)
    from database.stock_populator import StockListFetcher
    print("\nFetching NSE stock list...")
    stock_list = StockListFetcher.get_nse_stock_list()
    # populator.populate_initial_stocks(stock_list)
    
    # 2. Enrich ALL stocks
    print("\nEnriching ALL stocks with Ownership Data...")
    # Passing max_stocks=None processes all stocks needing update
    # Users can interrupt with Ctrl+C
    result = populator.enrich_stock_data(batch_size=5, max_stocks=None)
    
    print(f"Enrichment Complete: {result}")

if __name__ == "__main__":
    main()
