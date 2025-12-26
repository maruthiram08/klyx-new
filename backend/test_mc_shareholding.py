from Fundamentals.MoneyControl import MoneyControl
import pandas as pd
import requests
from bs4 import BeautifulSoup
import logging
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_shareholding_scrape():
    symbol = "RELIANCE"
    mc = MoneyControl()
    
    # 1. Get ID
    search_res = mc.get_ticker(symbol)
    mc_id = search_res[0] if isinstance(search_res, tuple) else None
    
    if not mc_id:
        print(f"Failed to find ID for {symbol}")
        return

    # 2. Quote URL
    quote_url = f"https://www.moneycontrol.com/india/stockpricequote/infrastructure-general/relianceindustries/{mc_id}"
    print(f"Testing Quote URL: {quote_url}")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
        "Referer": "https://www.google.com/"
    }

    try:
        resp = requests.get(quote_url, headers=headers)
        if resp.status_code == 200:
            print("Quote Page loaded successfully.")
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # Strategy 3: Check if tables are already in the Quote Page DOM
            print("--- Checking Quote Page Tables ---")
            try:
                dfs = pd.read_html(resp.text)
                print(f"Found {len(dfs)} tables on Quote Page.")
                for i, df in enumerate(dfs):
                    df_str = str(df)
                    if 'Promoter' in df_str and ('% Hol' in df_str or 'Nos.' in df_str or 'No. of Shares' in df_str):
                         print(f"\n--- MATCH: Shareholding Summary (Table {i}) ---")
                         print(df.head(10))
                         return # Success!
                    
                    if i < 3:
                         print(f"Quote Table {i} peek:\n{df.head(2)}")
            except Exception as e:
                print(f"Error parsing quote page tables: {e}")

            # Strategy 4: Alternative URLs if ID/Slug known
            # From previous run, slug is 'relianceindustries'
            # Try: company-facts
            alt_url_1 = f"https://www.moneycontrol.com/company-facts/relianceindustries/shareholding-pattern/{mc_id}"
            print(f"\nTesting Alt URL 1: {alt_url_1}")
            try:
                r1 = requests.get(alt_url_1, headers=headers)
                if r1.status_code == 200:
                    dfs = pd.read_html(r1.text)
                    print(f"Found {len(dfs)} tables on Alt 1.")
            except Exception as e: print(e)
            
            # Try: financials ... VI
            alt_url_2 = f"https://www.moneycontrol.com/financials/relianceindustries/shareholding-pattern/VI/{mc_id}"
            print(f"Testing Alt URL 2: {alt_url_2}")
            try:
                r2 = requests.get(alt_url_2, headers=headers)
                if r2.status_code == 200:
                     dfs = pd.read_html(r2.text)
                     print(f"Found {len(dfs)} tables on Alt 2.")
                     for i, df in enumerate(dfs):
                        if 'Promoter' in str(df):
                            print(df.head())
            except Exception as e: print(e)


        else:
            print(f"Failed to fetch Quote page: Status {resp.status_code}")
            
    except Exception as e:
        print(f"Error scraping: {e}")

if __name__ == "__main__":
    test_shareholding_scrape()
