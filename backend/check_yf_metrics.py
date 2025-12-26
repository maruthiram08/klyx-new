import yfinance as yf
import json

def check_yfinance_capabilities():
    ticker = "RELIANCE.NS"
    print(f"Fetching info for {ticker}...")
    stock = yf.Ticker(ticker)
    info = stock.info
    
    # Key metrics we currently get from Excel
    target_metrics = [
        'returnOnEquity', # Replaces ROE Annual %
        'trailingPE',     # Replaces PE TTM
        'currentPrice',   # Replaces Current Price
        'marketCap',      # Replaces Market Capitalization
        'debtToEquity',   # Bonus
        'currentRatio',   # Bonus
        'totalRevenue',   # For growth calc?
        'revenueGrowth',
        'earningsGrowth'
    ]
    
    found = {}
    missing = []
    
    for metric in target_metrics:
        val = info.get(metric)
        if val is not None:
            found[metric] = val
        else:
            missing.append(metric)
            
    print("\n--- FOUND METRICS ---")
    print(json.dumps(found, indent=2))
    
    print("\n--- MISSING METRICS ---")
    print(missing)

if __name__ == "__main__":
    check_yfinance_capabilities()
