from services.market_data_service import market_data_service
import json

def test_quarterly_fetch():
    nse_code = "RELIANCE"
    print(f"Fetching Quarterly Data for {nse_code} from MoneyControl...")
    mc_data = market_data_service.get_fundamentals(nse_code)
    
    if "error" not in mc_data and "profit_loss" in mc_data:
        pl = mc_data["profit_loss"]
        # print("PL Data Sample:", json.dumps(pl[:2], indent=2))

        def find_value(key_list, data_rows):
            for r in data_rows:
                row_header = str(r.get('headers', '') or r.get('Annual', '') or r.get('Attributes', '')).lower()
                if any(k.lower() in row_header for k in key_list):
                    date_keys = [k for k in r.keys() if k not in ['headers', 'Annual', 'Unnamed: 0', 'Attributes']]
                    if not date_keys: return None
                    first_date_key = date_keys[0]
                    print(f"  Found '{row_header}' in column '{first_date_key}': {r[first_date_key]}")
                    return r[first_date_key]
            return None

        # 1. Operating Revenue Qtr
        rev_val = find_value(['Sales', 'Revenue', 'Income from Operations'], pl)
        if rev_val:
            val_clean = float(str(rev_val).replace(',', ''))
            print(f"  > Parsed Revenue: {val_clean} Cr -> {val_clean * 10000000}")
        else:
            print("  > Revenue NOT found")

        # 2. Net Profit Qtr
        pat_val = find_value(['Net Profit', 'Profit After Tax', 'PAT'], pl)
        if pat_val:
            val_clean = float(str(pat_val).replace(',', ''))
            print(f"  > Parsed Profit: {val_clean} Cr -> {val_clean * 10000000}")
        else:
            print("  > Profit NOT found")

if __name__ == "__main__":
    test_quarterly_fetch()
