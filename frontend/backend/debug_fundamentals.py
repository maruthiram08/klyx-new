from services.market_data_service import market_data_service
import json

def debug_fundamentals():
    symbol = "RELIANCE"
    print(f"Fetching fundamentals for {symbol}...")
    data = market_data_service.get_fundamentals(symbol)
    
    if "error" in data:
        print("Error:", data["error"])
        return

    print("\n--- Balance Sheet Structure (First 5 Rows) ---")
    if data.get("balance_sheet"):
        print(json.dumps(data["balance_sheet"][:5], indent=2))
        print("\n--- All Row Headers in Balance Sheet ---")
        for row in data["balance_sheet"]:
             metric = row.get("headers") or row.get("Annual") or row.get("Unnamed: 0") or row.get("Attributes") or str(row)
             print(f"- {metric}")
    else:
        print("No Balance Sheet data.")
        
    print("\n--- Keys in First Row ---")
    if data.get("balance_sheet"):
        print(list(data["balance_sheet"][0].keys()))

if __name__ == "__main__":
    debug_fundamentals()
