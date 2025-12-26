import yfinance as yf
import json

def check_more_metrics():
    ticker = "RELIANCE.NS"
    print(f"Fetching extended info for {ticker}...")
    stock = yf.Ticker(ticker)
    info = stock.info
    
    target_metrics = [
        'totalRevenue',
        'netIncomeToCommon',
        'operatingMargins', 
        'operatingCashflow',
        'grossMargins',
        'ebitda'
    ]
    
    found = {}
    for metric in target_metrics:
        found[metric] = info.get(metric)
            
    print("\n--- EXTENDED METRICS ---")
    print(json.dumps(found, indent=2))

if __name__ == "__main__":
    check_more_metrics()
