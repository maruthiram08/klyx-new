import requests
import json

BASE_URL = "http://127.0.0.1:5001/api"

def test_toggle():
    symbol = "RELIANCE"
    print(f"Testing Financials Toggle for {symbol}...")

    # Helper to find revenue
    def get_revenue(data):
        for row in data:
            header = row.get('headers', '')
            if 'Revenue' in str(header) or 'Sales' in str(header):
                # Return latest year value (2nd key usually)
                keys = list(row.keys())
                # filter keys that look like 'Mar 2X' or similar
                date_keys = [k for k in keys if 'Mar' in k or 'Dec' in k]
                if date_keys:
                    return row[date_keys[0]]
        return None

    # 1. Fetch Standalone (Default)
    print("\n1. Fetching Standalone...")
    try:
        resp = requests.get(f"{BASE_URL}/stock/{symbol}/fundamentals")
        data_std = resp.json()['data']
        pl_std = data_std.get('profit_loss', [])
        rev_std = get_revenue(pl_std)
        print(f"Standalone Revenue: {rev_std}")
    except Exception as e:
        print(f"Standalone fetch failed: {e}")
        return

    # 2. Fetch Consolidated
    print("\n2. Fetching Consolidated...")
    try:
        resp = requests.get(f"{BASE_URL}/stock/{symbol}/fundamentals?type=consolidated")
        data_con = resp.json()['data']
        pl_con = data_con.get('profit_loss', [])
        rev_con = get_revenue(pl_con)
        print(f"Consolidated Revenue: {rev_con}")
    except Exception as e:
        print(f"Consolidated fetch failed: {e}")
        return

    # Comparison
    print("\n--- Comparison ---")
    if rev_std and rev_con:
        if float(str(rev_con).replace(',','')) > float(str(rev_std).replace(',','')):
             print("SUCCESS: Consolidated Revenue is higher than Standalone.")
        else:
             print("WARNING: Consolidated Revenue is NOT higher. Check data.")
             print(f"Std: {rev_std}, Con: {rev_con}")
    else:
        print("Comparison failed due to missing data.")

if __name__ == "__main__":
    test_toggle()
