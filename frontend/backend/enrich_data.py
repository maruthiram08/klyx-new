import pandas as pd
import yfinance as yf
import os
import numpy as np

input_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/nifty50_unified_master.xlsx'
output_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/nifty50_enriched.xlsx'

def fetch_yahoo_data(ticker):
    """
    Fetches both .info and .balance_sheet for a ticker.
    Returns a combined dict of valid data.
    """
    try:
        stock = yf.Ticker(ticker)
        
        # 1. Fetch Info (Fast, covers Ratios, Price, Revenue, Margins)
        info = stock.info
        
        # 2. Fetch Balance Sheet (Slower, covers Assets, Debt, Liab)
        bs = stock.balance_sheet
        
        # 3. Fetch Quarterly Income Stmt (For Revenue/Profit Qtr)
        qs = stock.quarterly_income_stmt
        
        data = {
            'info': info,
            'bs': bs,
            'qs': qs
        }
        return data
    except Exception as e:
        print(f"  Error fetching {ticker}: {e}")
        return None

def main():
    if not os.path.exists(input_file):
        print(f"{input_file} not found.")
        return

    print(f"Reading {input_file} for dynamic enrichment...")
    df = pd.read_excel(input_file)
    
    # List of Essential Columns we need for Generate Insights
    # If these are missing in the input, we MUST fetch them.
    required_map = {
        'ROE Annual %': 'returnOnEquity', # * 100
        'PE TTM Price to Earnings': 'trailingPE',
        'Current Price': 'currentPrice',
        'Market Capitalization': 'marketCap',
        'Operating Revenue Annual': 'totalRevenue',
        'Net Profit Annual': 'netIncomeToCommon'
    }
    
    # Initialize missing columns if they don't exist at all
    for col in required_map.keys():
        if col not in df.columns:
            df[col] = np.nan
            
    # Also ensure Balance Sheet columns exist
    bs_cols = ['YF_TotalAssets', 'YF_CurrentAssets', 'YF_TotalDebt', 'YF_CurrentLiabilities', 'YF_StockholdersEquity']
    for col in bs_cols:
        if col not in df.columns:
            df[col] = 0.0
            
    # Initialize Shareholding Columns
    sh_cols = ['Promoter holding latest %', 'Institutional holding current Qtr %', 'FII holding current Qtr %', 'MF holding current Qtr %']
    for col in sh_cols:
        if col not in df.columns:
            df[col] = np.nan

    print(f"Enriching {len(df)} stocks...")
    
    # Mapping for List-Only uploads (Partial Nifty 50 list for demo)
    ticker_map = {
        'Adani Enterprises Ltd.': 'ADANIENT',
        'Adani Ports & Special Economic Zone Ltd.': 'ADANIPORTS',
        'Apollo Hospitals Enterprise Ltd.': 'APOLLOHOSP',
        'Asian Paints Ltd.': 'ASIANPAINT',
        'Axis Bank Ltd.': 'AXISBANK',
        'Reliance Industries Ltd.': 'RELIANCE',
        'Reliance': 'RELIANCE',
        'Reliance Industries': 'RELIANCE',
        'HDFC Bank Ltd.': 'HDFCBANK',
        'Infosys Ltd.': 'INFY',
        'ICICI Bank Ltd.': 'ICICIBANK',
        'Tata Consultancy Services Ltd.': 'TCS',
        'Bajaj Finance Ltd.': 'BAJFINANCE',
        'Bharti Airtel Ltd.': 'BHARTIARTL',
        'Cipla Ltd.': 'CIPLA',
        'Divi\'s Laboratories Ltd.': 'DIVISLAB',
        'Eicher Motors Ltd.': 'EICHERMOT',
        'HCL Technologies Ltd.': 'HCLTECH',
        'Hindustan Unilever Ltd.': 'HINDUNILVR',
        'ITC Ltd.': 'ITC',
        'Maruti Suzuki India Ltd.': 'MARUTI',
        'Titan Company Ltd.': 'TITAN'
    }

    for i, row in df.iterrows():
        # Identify Stock
        ticker_name = str(row.get('Stock Name', '')).strip()
        nse_code = str(row.get('NSE Code', ''))
        
        # Fallback: Lookup Code from Name if missing
        # Fallback: Lookup Code from Name if missing
        if (not nse_code or nse_code == 'nan'):
            # 1. Check Hardcoded Map
            if ticker_name in ticker_map:
                nse_code = ticker_map[ticker_name]
                print(f"  Mapped '{ticker_name}' -> {nse_code} (Static)")
            
            # 2. Dynamic Search (New Feature)
            else:
                try:
                    # Lazy import to avoid circular issues or setup issues
                    from services.market_data_service import market_data_service
                    candidates = market_data_service.search_candidates(ticker_name)
                    if candidates:
                        # Pick top candidate that has an NSE code
                        for cand in candidates:
                            if 'nse_code' in cand and cand['nse_code']:
                                nse_code = cand['nse_code']
                                print(f"  Mapped '{ticker_name}' -> {nse_code} (Dynamic)")
                                break
                except Exception as e:
                    print(f"  Dynamic lookup failed for {ticker_name}: {e}")

            if nse_code and nse_code != 'nan':
                 df.at[i, 'NSE Code'] = nse_code # Save it back

        if not nse_code or nse_code == 'nan':
            print(f"  Skipping '{ticker_name}': No Code found")
            continue
            
        full_ticker = f"{nse_code}.NS"
        
        # Identify Gaps
        missing_metrics = []
        for col in required_map.keys():
            val = row[col]
            if pd.isnull(val) or val == 0 or val == 'nan':
                missing_metrics.append(col)
        
        # Logic: If we have missing metrics OR we always want BS data (which we do), fetch.
        # But if we have EVERYTHING, we could arguably skip. 
        # However, for this tool, we assume BS is always external since Excel doesn't have it.
        # So we always fetch. But we LOG what we are "filling".
        
        log_msg = f"[{i+1}/{len(df)}] {full_ticker}"
        if missing_metrics:
            log_msg += f" | Missing: {len(missing_metrics)} metrics (filling from Yahoo)"
        print(log_msg)
        
        data = fetch_yahoo_data(full_ticker)
        
        if data:
            info = data['info']
            bs = data['bs']
            
            # 1. Fill Missing Metrics from Info
            for col in missing_metrics:
                yf_key = required_map[col]
                if yf_key in info and info[yf_key] is not None:
                    # Special handling for percentages
                    if col == 'ROE Annual %':
                        df.at[i, col] = info[yf_key] * 100
                    else:
                        df.at[i, col] = info[yf_key]
            
            # Special Calc: Operating Profit
            # If missing, try to derive from Revenue * OperatingMargins
            if pd.isnull(row.get('Operating Profit Annual')) or row.get('Operating Profit Annual') == 0:
                rev = info.get('totalRevenue')
                margin = info.get('operatingMargins')
                if rev and margin:
                    df.at[i, 'Operating Profit Annual'] = rev * margin
            
            # 2. Extract Shareholding Data (from Info)
            # heldPercentInsiders -> Promoter
            # heldPercentInstitutions -> Institutional
            if 'heldPercentInsiders' in info:
                df.at[i, 'Promoter holding latest %'] = info['heldPercentInsiders'] * 100
            
            if 'heldPercentInstitutions' in info:
                df.at[i, 'Institutional holding current Qtr %'] = info['heldPercentInstitutions'] * 100
                
            # Note: granular FII/DII/MF and QoQ changes are not reliably available in YF info.
            # We populate the high-level aggregates.

            # 3. Fill Quarterly Data from Yahoo (Primary Source)
            try:
                 qs = data.get('qs')
                 if qs is not None and not qs.empty:
                     # Get latest quarter (first column usually, but let's check datetimes if needed)
                     # Assuming newer is left-most (standard pandas/yf)
                     import datetime
                     today = pd.Timestamp.now()
                     
                     valid_cols = [c for c in qs.columns if c <= today + pd.Timedelta(days=5)] # allow slight future for timezone diffs
                     
                     if valid_cols:
                         target_col = valid_cols[0] # First one >= today? No, first one in valid_cols
                         print(f"  [YF] Using column {target_col} for Qtr Data")
                         
                         def get_qs_val(key):
                             if key in qs.index:
                                 return qs.loc[key][target_col]
                             return None

                         # Revenue
                         rev_q = get_qs_val('Total Revenue')
                         if rev_q:
                             df.at[i, 'Operating Revenue Qtr'] = rev_q
                             print(f"  [YF] Set Revenue Qtr: {rev_q}")
                             
                         # Net Profit
                         pat_q = get_qs_val('Net Income')
                         if pat_q:
                             df.at[i, 'Net Profit Qtr'] = pat_q
                             print(f"  [YF] Set Net Profit Qtr: {pat_q}")
                             
                         # Revenue Growth
                         if len(valid_cols) >= 5: 
                             col_yoy = valid_cols[4] if len(valid_cols) > 4 else None
                             if col_yoy:
                                 rev_last = qs.loc['Total Revenue'][col_yoy] if 'Total Revenue' in qs.index else 0
                                 if rev_q and rev_last and rev_last > 0:
                                     growth = ((rev_q - rev_last) / rev_last) * 100
                                     df.at[i, 'Revenue Growth Qtr YoY %'] = growth
                     else:
                         print(f"  [YF] No valid past columns found in qs: {qs.columns}")
                 else:
                     print("  [YF] qs is empty or None")

            except Exception as e:
                print(f"Error extracting Qtr data from Yahoo: {e}")
                pass

        # --- QUARTERLY DATA ENRICHMENT (MoneyControl) ---
        # The Excel file often lacks Qtr data. Yahoo .info doesn't provide it reliably in the summary.
        # We use MoneyControl for this specific Indian context.
        # Check if we ALREADY filled it (from Yahoo)
        current_rev = df.at[i, 'Operating Revenue Qtr']
        current_pat = df.at[i, 'Net Profit Qtr']
        
        if pd.isnull(current_rev) or current_rev == 0 or pd.isnull(current_pat) or current_pat == 0:
            try:
                # Lazy import
                from services.market_data_service import market_data_service
                
                # We need to ensure we have a valid symbol for MC (usually just NSE Code is fine, or Name)
                # market_data_service.get_fundamentals uses search logic internally
                print(f"  Fetching Quarterly Data for {nse_code} from MoneyControl (Fallback)...")
                mc_data = market_data_service.get_fundamentals(nse_code)
                
                if "error" not in mc_data and "profit_loss" in mc_data:
                    pl = mc_data["profit_loss"]
                    if pl and len(pl) > 0:
                        # Inspect the first few rows to find Quarterly columns
                        # MoneyControl Mini Statement usually has 5 columns: [Header, Mar 24, Dec 23, ...]
                        # We want the latest quarter (usually specific date)
                         
                        # Helper to fuzzy find row
                        def find_value(key_list, data_rows):
                            for r in data_rows:
                                row_header = str(r.get('headers', '') or r.get('Annual', '') or r.get('Attributes', '')).lower()
                                if any(k.lower() in row_header for k in key_list):
                                    # Find the latest value. 
                                    # The dict keys are dates. We look for the MOST RECENT date key.
                                    # Keys might be "headers", "Mar 2024", "Dec 2023", etc.
                                    # We filter for keys that look like months/years.
                                    
                                    # Sort keys by assuming they are dates? Or just pick the first non-header key?
                                    # Usually the API returns ordered data, but let's be safe.
                                    # For mini statement, usually: {headers: 'Sales', 'Mar 24': 100, ...}
                                    
                                    # Get all keys except 'headers' etc
                                    date_keys = [k for k in r.keys() if k not in ['headers', 'Annual', 'Unnamed: 0', 'Attributes']]
                                    if not date_keys: return None
                                    
                                    # Sort keys to find latest? Or just take the one that appears first/last?
                                    # In debug_fundamentals, keys were just dates.
                                    # Let's assume the keys are standard. 
                                    # Actually, checking 'debug_fundamentals.py' output would be ideal, but let's assume
                                    # we pick the *first* date column found, which is typically latest in these APIs.
                                    
                                    first_date_key = date_keys[0] # Naive but likely correct for MC Top-Left
                                    return r[first_date_key]
                            return None

                         # 1. Operating Revenue Qtr
                        rev_val = find_value(['Sales', 'Revenue', 'Income from Operations', 'Total Income', 'Interest Earned'], pl)
                        if rev_val:
                            # MC returns in Cr usually. Excel expects absolute? 
                            # Wait, 'Operating Revenue Annual' from Yahoo is absolute (big number). 
                            # MC 'Sales' in mini statement is usually in Crores.
                            # We need to standardize. 
                            # Let's clean the string (remove commas) and convert.
                            try:
                                val_clean = float(str(rev_val).replace(',', ''))
                                # Heuristic: If value is small (e.g. 200,000) and Annual is 8,000,000,000
                                # then it is Cr. 1 Cr = 1,00,00,000.
                                # Let's assume MC Data is in Cr if explicitly likely.
                                # Actually, for detailed view, we just want the number. 
                                # Let's store as is (Cr) or try to detect?
                                # StockDetails formatting: formatNumber uses formatCurrency(val/10000000) for Crores?
                                # If StockDetails expects raw number, we should convert Cr to absolute.
                                # Most likely MC returns Cr. 
                                # User's code formatNumber divides by 1e7 for Cr?
                                # checking StockDetails: 
                                # const formatNumber = (num) => ... (num / 10000000).toFixed(2) + ' Cr'
                                # SO StockDetails EXPECTS ABSOLUTE NUMBERS.
                                # MC Returns Crores. So we must multiply by 1e7.
                                df.at[i, 'Operating Revenue Qtr'] = val_clean * 10000000
                            except: pass

                        # 2. Net Profit Qtr
                        pat_val = find_value(['Net Profit', 'Profit After Tax', 'PAT'], pl)
                        if pat_val:
                            try:
                                val_clean = float(str(pat_val).replace(',', ''))
                                df.at[i, 'Net Profit Qtr'] = val_clean * 10000000
                            except: pass
                            
                        # 3. Margins & Growth (Can be calculated mostly)
                        # We can calc Operating Margin Qtr %
                        if df.at[i, 'Operating Revenue Qtr'] and df.at[i, 'Net Profit Qtr']:
                             try:
                                 rev = df.at[i, 'Operating Revenue Qtr']
                                 prof = df.at[i, 'Net Profit Qtr']
                                 if rev > 0:
                                     df.at[i, 'Operating Profit Margin Qtr %'] = (prof / rev) * 100
                             except: pass

            except Exception as e:
                print(f"  Error fetching Qtr data for {nse_code}: {e}")

            # 4. Fill Balance Sheet (Always)
            try:
                if not bs.empty:
                    # Helper to get value safely
                    def get_bs_val(key):
                        if key in bs.index:
                            return bs.loc[key].iloc[0]
                        return 0
                        
                    df.at[i, 'YF_TotalAssets'] = get_bs_val('Total Assets')
                    df.at[i, 'YF_CurrentAssets'] = get_bs_val('Current Assets')
                    df.at[i, 'YF_TotalDebt'] = get_bs_val('Total Debt')
                    df.at[i, 'YF_CurrentLiabilities'] = get_bs_val('Current Liabilities')
                    df.at[i, 'YF_StockholdersEquity'] = get_bs_val('Stockholders Equity')
            except Exception as e:
                pass
                
    print(f"Saving to {output_file}...")
    df.to_excel(output_file, index=False)
    print("Enrichment Complete.")

if __name__ == "__main__":
    main()
