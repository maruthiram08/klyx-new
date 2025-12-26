from services.market_data_service import market_data_service
import json

def debug_ratios():
    symbol = "RELIANCE"
    print(f"Fetching fundamentals for {symbol}...")
    data = market_data_service.get_fundamentals(symbol)
    
    print("\n--- Ratios Structure (First 2 Rows) ---")
    if data.get("ratios"):
        print(json.dumps(data["ratios"][:2], indent=2))
        print("\nKeys:", list(data["ratios"][0].keys()))
    else:
        print("No Ratios data.")

if __name__ == "__main__":
    debug_ratios()
