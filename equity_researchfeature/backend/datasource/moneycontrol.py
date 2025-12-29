import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
from .screener import parse_number, parse_fiscal_year, safe_get, normalize_row_name

MC_ID_MAP = {
    'HDFCBANK': ('hdfcbank', 'HDF01'),
    'ICICIBANK': ('icicibank', 'ICI02'),
    'SBIN': ('sbin', 'SBI'),
    'BAJFINANCE': ('bajajfinance', 'BF04'),
    'CHOLAFIN': ('cholamandalaminvestmentfinancecompany', 'CIF01')
}

def get_mc_identifiers(nse_code: str):
    return MC_ID_MAP.get(nse_code.upper(), (None, None))

def fetch_moneycontrol_data(nse_code: str) -> dict:
    """Wrapper for StockDataProcessor compatibility"""
    symbol, sc_id = get_mc_identifiers(nse_code)
    if not symbol or not sc_id:
        return {}
    
    # Fetch from both Ratios and Balance Sheet pages
    ratios_data = fetch_mc_page(symbol, sc_id, "ratiosVI")
    bs_data = fetch_mc_page(symbol, sc_id, "balance-sheetVI")
    
    # Merge by fiscal year
    merged_by_year = {}
    
    def merge_ratios(data_list):
        for item in data_list:
            fy = item.get('fiscal_year')
            if fy:
                if fy not in merged_by_year: merged_by_year[fy] = {}
                # Update only non-None values
                for k, v in item.items():
                    if v is not None:
                        merged_by_year[fy][k] = v
    
    merge_ratios(ratios_data)
    merge_ratios(bs_data)
    
    return {
        'moneycontrol_ratios': list(merged_by_year.values()),
        'fetched_at': datetime.now().isoformat()
    }

def fetch_mc_page(symbol: str, sc_id: str, page_type: str) -> list:
    """Generic fetcher for MoneyControl financials pages (ratiosVI, balance-sheetVI, etc.)"""
    url = f"https://www.moneycontrol.com/financials/{symbol}/{page_type}/{sc_id}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        table = None
        # Try finding the main data table
        for t in soup.find_all('table'):
            t_text = t.get_text()
            if 'Net Interest Margin' in t_text or 'EPS' in t_text or 'Capital Adequacy' in t_text:
                table = t
                break
        
        if not table:
            return []
        
        # Extract headers (Years)
        headers_list = []
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) > 2:
                potential_headers = [c.get_text(strip=True) for c in cells[1:]]
                if any(re.search(r'Mar\s+\d+|20\d{2}', h) for h in potential_headers):
                    headers_list = potential_headers
                    break
        
        # Extract rows
        data_by_row = {}
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) < 2: continue
            
            label = normalize_row_name(cells[0].get_text())
            values = [parse_number(c.get_text(strip=True)) for c in cells[1:]]
            data_by_row[label] = values
            
        # Map values
        results = []
        for i, year in enumerate(headers_list):
            if i >= 10: break
            results.append({
                'fiscal_year': parse_fiscal_year(year),
                'nim_pct': safe_get(data_by_row, 'Net Interest Margin (X)', i),
                'roe_pct': safe_get(data_by_row, 'Return on Equity / Networth (%)', i),
                'casa_pct': safe_get(data_by_row, 'CASA (%)', i),
                'car_pct': safe_get(data_by_row, 'Capital Adequacy Ratios (%)', i) or safe_get(data_by_row, 'Capital Adequacy Ratio', i),
                'tier1_pct': safe_get(data_by_row, 'Tier 1 (%)', i),
                'gnpa_pct': safe_get(data_by_row, 'Gross NPA (%)', i),
                'nnpa_pct': safe_get(data_by_row, 'Net NPA (%)', i)
            })
            
        return results
    except Exception as e:
        print(f"Error fetching MC {page_type} for {symbol}: {e}")
        return []

def fetch_moneycontrol_ratios(symbol: str, sc_id: str) -> list:
    """Kept for backward compatibility"""
    return fetch_mc_page(symbol, sc_id, "ratiosVI")
