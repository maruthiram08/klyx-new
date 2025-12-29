import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import re

def fetch_screener_data(nse_code: str) -> dict:
    """
    Fetch historical financial data from Screener.in, merging consolidated and standalone if both exist.
    
    Args:
        nse_code: NSE trading symbol (e.g., "RELIANCE")
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    # URLs to check: consolidated first, then standalone
    urls = [
        f"https://www.screener.in/company/{nse_code}/consolidated/",
        f"https://www.screener.in/company/{nse_code}/"
    ]
    
    soups = []
    
    for url in urls:
        try:
            response = requests.get(url, headers=headers, timeout=30) # Increased timeout
            if response.status_code == 200:
                soups.append(BeautifulSoup(response.text, 'html.parser'))
            # If 404 for consolidated, we'll try standalone next.
            # If 404 for standalone, it means no data found for this NSE code.
            elif response.status_code == 404 and url == urls[1]: # If standalone also 404
                return {'error': f'HTTP 404: No data found for {nse_code}', 'nse_code': nse_code}
        except requests.RequestException as e:
            # Log error but continue to try next URL if available
            print(f"Error fetching {url}: {e}")

    if not soups:
        return {'error': f"Failed to fetch any data for {nse_code}", 'nse_code': nse_code}

    # The first successful soup is considered primary (ideally consolidated)
    primary_soup = soups[0]
    
    # We want to extract ratios by scanning tables from ALL soups
    # to catch rows that might be missing in one (like NPA in consolidated)
    all_sections = []
    for s in soups:
        all_sections.extend(s.find_all('section'))
    
    # Create a temporary virtual soup containing all sections
    # This allows extract_ratios_table to see everything
    mega_soup = BeautifulSoup("", 'html.parser')
    for sect in all_sections:
        mega_soup.append(sect)

    result = {
        'nse_code': nse_code,
        'profit_loss': extract_profit_loss_table(mega_soup),
        'balance_sheet': extract_balance_sheet_table(mega_soup),
        'cash_flow': extract_cash_flow_table(mega_soup),
        'ratios': extract_ratios_table(mega_soup), 
        'shareholding': extract_shareholding_table(mega_soup),
        'fetched_at': datetime.now().isoformat(),
        'source': 'screener.in'
    }
    
    # Step 6: MANDATORY rate limiting
    time.sleep(2)
    
    return result


def normalize_row_name(text: str) -> str:
    """Clean row name of whitespace, + signs, and special characters like \xa0"""
    if not text: return ""
    # Remove +, then replace all whitespace (including \xa0) with a single space, then strip
    clean = text.replace('+', '')
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def extract_profit_loss_table(soup: BeautifulSoup) -> list:
    """Extract annual P&L data"""
    
    section = soup.find('section', {'id': 'profit-loss'})
    if not section:
        return []
    
    table = section.find('table')
    if not table:
        return []
    
    # Get year headers
    headers = []
    header_row = table.find('thead')
    if header_row:
        for th in header_row.find_all('th')[1:]:
            headers.append(th.get_text(strip=True))
    
    # Get row data
    data_by_row = {}
    tbody = table.find('tbody')
    if tbody:
        for row in tbody.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) < 2:
                continue
            
            row_name = normalize_row_name(cells[0].get_text())
            values = []
            for cell in cells[1:]:
                text = cell.get_text(strip=True)
                values.append(parse_number(text))
            
            data_by_row[row_name] = values
    
    # Convert to year-by-year format
    results = []
    for i, year in enumerate(headers):
        # Determine Net Interest Income if possible
        ii = safe_get(data_by_row, 'Interest', i)
        ie = safe_get(data_by_row, 'Interest Expended', i) or safe_get(data_by_row, 'Interest Expense', i)
        
        # Calculate NII if both parts exist
        nii = (ii - ie) if (ii is not None and ie is not None) else None
        
        year_data = {
            'fiscal_year': parse_fiscal_year(year),
            'revenue_cr': safe_get(data_by_row, 'Sales', i) or ii,
            'interest_income_cr': ii,
            'interest_expense_cr': ie,
            'net_interest_income_cr': nii,
            'expenses_cr': safe_get(data_by_row, 'Expenses', i),
            'financing_profit_cr': safe_get(data_by_row, 'Financing Profit', i),
            'operating_profit_cr': safe_get(data_by_row, 'Operating Profit', i),
            'opm_pct': safe_get(data_by_row, 'OPM %', i),
            'other_income_cr': safe_get(data_by_row, 'Other Income', i),
            'interest_cr': ie, # Used for standard interest coverage
            'depreciation_cr': safe_get(data_by_row, 'Depreciation', i),
            'profit_before_tax_cr': safe_get(data_by_row, 'Profit before tax', i),
            'tax_pct': safe_get(data_by_row, 'Tax %', i),
            'net_profit_cr': safe_get(data_by_row, 'Net Profit', i),
            'eps': safe_get(data_by_row, 'EPS in Rs', i),
            'dividend_payout_pct': safe_get(data_by_row, 'Dividend Payout %', i),
        }
        results.append(year_data)
    
    return results


def extract_balance_sheet_table(soup: BeautifulSoup) -> list:
    """Extract annual Balance Sheet data"""
    
    section = soup.find('section', {'id': 'balance-sheet'})
    if not section:
        return []

    table = section.find('table')
    if not table:
        return []

    # Get year headers
    headers = []
    header_row = table.find('thead')
    if header_row:
        for th in header_row.find_all('th')[1:]:
            headers.append(th.get_text(strip=True))

    # Get row data
    data_by_row = {}
    tbody = table.find('tbody')
    if tbody:
        for row in tbody.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) < 2:
                continue
            
            row_name = normalize_row_name(cells[0].get_text())
            
            # Handle aliases
            if row_name == 'Equity Capital':
                row_name = 'Share Capital'
                
            values = []
            for cell in cells[1:]:
                text = cell.get_text(strip=True)
                values.append(parse_number(text))
            
            data_by_row[row_name] = values

    # Convert to year-by-year format
    results = []
    for i, year in enumerate(headers):
        year_data = {
            'fiscal_year': parse_fiscal_year(year),
            'share_capital_cr': safe_get(data_by_row, 'Share Capital', i),
            'reserves_cr': safe_get(data_by_row, 'Reserves', i),
            'borrowings_cr': safe_get(data_by_row, 'Borrowings', i),
            'other_liabilities_cr': safe_get(data_by_row, 'Other Liabilities', i),
            'total_liabilities_cr': safe_get(data_by_row, 'Total Liabilities', i),
            'fixed_assets_cr': safe_get(data_by_row, 'Fixed Assets', i),
            'cwip_cr': safe_get(data_by_row, 'CWIP', i),
            'investments_cr': safe_get(data_by_row, 'Investments', i),
            'other_assets_cr': safe_get(data_by_row, 'Other Assets', i),
            'total_assets_cr': safe_get(data_by_row, 'Total Assets', i),
            'cash_and_equivalents_cr': safe_get(data_by_row, 'Cash & Equivalents', i) or safe_get(data_by_row, 'Cash & Bank', i),
        }
        results.append(year_data)
    
    return results


def extract_cash_flow_table(soup: BeautifulSoup) -> list:
    """Extract annual Cash Flow data"""
    
    section = soup.find('section', {'id': 'cash-flow'})
    if not section:
        return []
    
    table = section.find('table')
    if not table:
        return []

    # Get year headers
    headers = []
    header_row = table.find('thead')
    if header_row:
        for th in header_row.find_all('th')[1:]:
            headers.append(th.get_text(strip=True))
            
    # Get row data
    data_by_row = {}
    tbody = table.find('tbody')
    if tbody:
        for row in tbody.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) < 2:
                continue
            
            row_text = normalize_row_name(cells[0].get_text())
            # Normalize row names (Cash from Operating Activity can vary)
            if 'Operating' in row_text: row_name = 'Operating'
            elif 'Investing' in row_text: row_name = 'Investing'
            elif 'Financing' in row_text: row_name = 'Financing'
            elif 'Net Cash' in row_text: row_name = 'Net'
            else: row_name = row_text

            values = []
            for cell in cells[1:]:
                text = cell.get_text(strip=True)
                values.append(parse_number(text))
            
            data_by_row[row_name] = values

    # Convert format
    results = []
    for i, year in enumerate(headers):
        year_data = {
            'fiscal_year': parse_fiscal_year(year),
            'operating_cash_flow_cr': safe_get(data_by_row, 'Operating', i),
            'investing_cash_flow_cr': safe_get(data_by_row, 'Investing', i),
            'financing_cash_flow_cr': safe_get(data_by_row, 'Financing', i),
            'net_cash_flow_cr': safe_get(data_by_row, 'Net', i),
        }
        results.append(year_data)

    return results


BANKING_FIELD_MAPPINGS = {
    'gnpa_pct': ['Gross NPA %', 'GNPA %', 'Gross NPA', 'GNPA', 'Gross Stage 3 %', 'Stage 3 %', 'Gross NPAs / Gross Advances'],
    'nnpa_pct': ['Net NPA %', 'NNPA %', 'Net NPA', 'NNPA', 'Net Stage 3 %', 'Net Stage 3'],
    'pcr_pct': ['Provision Coverage Ratio', 'Provision Coverage', 'PCR %', 'PCR', 'Provision Coverage Ratio %', 'Provision coverage %'],
    'car_pct': ['Capital Adequacy Ratio', 'Capital Adequacy Ratio %', 'CAR %', 'CAR', 'CRAR', 'CRAR %', 'Capital to Risk Weighted Assets', 'Capital adequacy %'],
    'tier1_pct': ['Tier 1 Ratio', 'Tier 1 %', 'Tier I Ratio', 'CET1'],
    'nim_pct': ['Net Interest Margin', 'NIM %', 'NIM', 'Net Interest Margin %'],
    'cost_to_income_pct': ['Cost to Income', 'Cost to Income Ratio', 'Cost/Income', 'C/I Ratio', 'Cost to Income %', 'Operating Cost to Income'],
    'casa_pct': ['CASA Ratio', 'CASA %', 'CASA', 'Current & Savings Deposits %'],
    'gearing_ratio': ['Gearing Ratio', 'Gearing', 'Financial Leverage', 'Borrowings / Net Worth'],
    'credit_cost_pct': ['Credit Cost', 'Credit Cost %', 'Provision Expense %', 'Credit Cost Ratio']
}

def extract_ratios_table(soup: BeautifulSoup) -> list:
    """Extract annual ratios by scanning all tables and merging by year"""
    data_by_year = {} # { year: { label: value } }
    
    sections = soup.find_all('section')
    for section in sections:
        table = section.find('table')
        if not table: continue
        
        # Get headers for this specific table
        table_headers = []
        thead = table.find('thead')
        if thead:
            for th in thead.find_all(['th', 'td'])[1:]:
                year = parse_fiscal_year(th.get_text(strip=True))
                table_headers.append(year)
        
        if not table_headers: continue
        
        # Extract row data for this table
        tbody = table.find('tbody')
        if not tbody: continue
        
        for row in tbody.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) < 2: continue
            
            label = normalize_row_name(cells[0].get_text())
            for i, val_cell in enumerate(cells[1:]):
                if i < len(table_headers):
                    year = table_headers[i]
                    if year:
                        if year not in data_by_year: data_by_year[year] = {}
                        val = parse_number(val_cell.get_text(strip=True))
                        if val is not None:
                            data_by_year[year][label] = val

    # Convert year-map to results list
    sorted_years = sorted(data_by_year.keys(), reverse=True)
    results = []
    
    def get_best_for_year(year_data, variants):
        # Exact match first
        for v in variants:
            if v in year_data: return year_data[v]
        # Fuzzy second
        for v in variants:
            v_lower = v.lower()
            for key in year_data:
                if v_lower in key.lower(): return year_data[key]
        return None

    for year in sorted_years:
        y_data = data_by_year[year]
        results.append({
            'fiscal_year': year,
            'roce_pct': y_data.get('ROCE %'),
            'roe_pct': y_data.get('ROE %'),
            'debt_to_equity': get_best_for_year(y_data, ['Debt to equity', 'Debt to Equity', 'Gearing Ratio']),
            'interest_coverage': y_data.get('Interest Coverage'),
            'inventory_turnover': y_data.get('Inventory Turnover'),
            'debtor_days': y_data.get('Debtor Days'),
            'asset_turnover': y_data.get('Asset Turnover'),
            
            # Banking Ratios
            'gross_npa_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['gnpa_pct']),
            'net_npa_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['nnpa_pct']),
            'capital_adequacy_ratio_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['car_pct']),
            'provision_coverage_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['pcr_pct']),
            'net_interest_margin_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['nim_pct']),
            'casa_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['casa_pct']),
            'cost_to_income_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['cost_to_income_pct']),
            'credit_cost_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['credit_cost_pct']),
            'tier1_pct': get_best_for_year(y_data, BANKING_FIELD_MAPPINGS['tier1_pct'])
        })
    
    return results


def extract_shareholding_table(soup: BeautifulSoup) -> list:
    """Extract quarterly Shareholding pattern"""
    
    section = soup.find('section', {'id': 'shareholding'})
    if not section:
        return []
    
    table = section.find('table')
    if not table:
        return []

    # Quarters are headers
    headers = []
    header_row = table.find('thead')
    if header_row:
        for th in header_row.find_all('th')[1:]:
            headers.append(th.get_text(strip=True))

    data_by_row = {}
    tbody = table.find('tbody')
    if tbody:
        for row in tbody.find_all('tr'):
            cells = row.find_all('td')
            if len(cells) < 2: continue
            
            row_name = normalize_row_name(cells[0].get_text())
            values = []
            for cell in cells[1:]:
                values.append(parse_number(cell.get_text(strip=True)))
            data_by_row[row_name] = values

    results = []
    for i, quarter in enumerate(headers):
        # Parse quarter string e.g., "Sep 2024"
        q_data = {
            'quarter_str': quarter,
            'promoters_pct': safe_get(data_by_row, 'Promoters', i),
            'fiis_pct': safe_get(data_by_row, 'FIIs', i),
            'diis_pct': safe_get(data_by_row, 'DIIs', i),
            'public_pct': safe_get(data_by_row, 'Public', i),
            'others_pct': safe_get(data_by_row, 'Others', i),
        }
        results.append(q_data)

    return results


# Helper functions
def parse_number(text: str) -> float:
    """Convert text to number, handling commas and negative signs"""
    if not text or text == '-':
        return None
    try:
        # Remove commas, handle Indian negative format
        clean = text.replace(',', '').replace('−', '-').replace('%', '').strip()
        return float(clean)
    except ValueError:
        return None


def parse_fiscal_year(text: str) -> int:
    """Extract fiscal year from header like 'Mar 2024', 'Mar 24', or '2024'"""
    if not text: return None
    
    # Match 4-digit year: 2024
    match = re.search(r'20(\d{2})', text)
    if match:
        return 2000 + int(match.group(1))
    
    # Match 2-digit year after month: Mar 24
    match = re.search(r'(?:Mar|Jun|Sep|Dec)\s*(\d{2})', text, re.I)
    if match:
        return 2000 + int(match.group(1))
        
    return None


def safe_get(data_dict: dict, key: str, index: int):
    """Safely get value from dict of lists"""
    if key not in data_dict:
        return None
    values = data_dict[key]
    if index >= len(values):
        return None
    return values[index]
