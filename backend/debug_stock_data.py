from services.market_data_service import market_data_service
import json

def debug_stock_data():
    symbol = "RELIANCE"
    print(f"Fetching stock data for {symbol}...")
    # Fetching the 'stock' object which comes from fetch_stock_details in app.py logic
    # Usually this is via get_latest_stock_price or similar, but let's check what 'get_fundamentals' returns too
    # Actually StockDetails uses 'stock' prop which comes from GET /api/stock/:code
    
    # In app.py: 
    # stock_data = market_data_service.get_stock_price(code)
    
    data = market_data_service.get_stock_price(symbol)

    if "error" in data:
        print("Error:", data["error"])
        return

    print("\n--- Stock Object Keys ---")
    print(list(data.keys()))
    
    print("\n--- Relevant Fields Check ---")
    targets = ['Operating Revenue', 'Net Profit', 'Revenue Growth', 'Operating Profit Margin', 'RSI', 'MACD', 'SMA']
    for k, v in data.items():
        if any(t.lower() in k.lower() for t in targets):
            print(f"{k}: {v}")

if __name__ == "__main__":
    debug_stock_data()
