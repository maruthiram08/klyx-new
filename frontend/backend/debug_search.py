from services.market_data_service import market_data_service
import json

def debug_search():
    term = "Reliance"
    print(f"Searching for '{term}'...")
    candidates = market_data_service.search_candidates(term)
    print("Candidates found:", len(candidates))
    if candidates:
        print(json.dumps(candidates[0], indent=2))
        # Print keys of first candidate to see if we have NSE symbol
        print("Keys:", candidates[0].keys())

if __name__ == "__main__":
    debug_search()
