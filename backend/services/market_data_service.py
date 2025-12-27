
import logging
from Fundamentals.MoneyControl import MoneyControl
import json
import pandas as pd

logger = logging.getLogger(__name__)

class MarketDataService:
    def __init__(self):
        self.mc = MoneyControl()
        self.details_cache = {} # Symbol -> Details Dict

    def get_moneycontrol_details(self, symbol):
        """
        Resolves a symbol to its MoneyControl details (ID, URL, etc).
        Returns a dict or None.
        """
        if symbol in self.details_cache:
            return self.details_cache[symbol]

        try:
            # Strip common suffixes for search
            search_symbol = symbol.split('.')[0]
            if search_symbol.endswith('.NS') or search_symbol.endswith('.BO'):
                 search_symbol = search_symbol[:-3]
            
            logger.info(f"Searching MoneyControl for symbol: {search_symbol} (original: {symbol})")
            # get_ticker returns tuple: (id, data_list)
            search_res = self.mc.get_ticker(search_symbol)
            
            if search_res and isinstance(search_res, tuple) and len(search_res) > 1 and search_res[1]:
                # Extract first match
                match = search_res[1][0]
                
                # Extract URL
                url = match.get('stock_url') or match.get('link_src') or match.get('url')
                
                if url:
                    details = {
                        'id': search_res[0],
                        'url': url,
                        'name': match.get('name')
                    }
                    self.details_cache[symbol] = details
                    return details
            
            logger.warning(f"No MoneyControl details found for {symbol}")
            return None
        except Exception as e:
            logger.error(f"Error searching MoneyControl for {symbol}: {e}")
            return None

    def search_candidates(self, symbol):
        """
        Returns a list of candidate matches for a symbol, including extracted NSE code.
        """
        try:
            import re
            # get_ticker returns (id, list_of_matches)
            res = self.mc.get_ticker(symbol)
            if res and isinstance(res, tuple) and len(res) > 1:
                candidates = res[1]
                for c in candidates:
                    # Extract info from "Reliance Industries&nbsp;<span>INE..., RELIANCE, 500325</span>"
                    if 'pdt_dis_nm' in c:
                        match = re.search(r'<span>(.*?)</span>', c['pdt_dis_nm'])
                        if match:
                            parts = [p.strip() for p in match.group(1).split(',')]
                            # Heuristic: Find the alphabetic upper case part (that isn't ISIN starting with IN)
                            for p in parts:
                                if p.isalpha() and p.isupper() and not p.startswith('IN') and len(p) < 12:
                                    c['nse_code'] = p
                                    break
                return candidates
            return []
        except Exception as e:
            logger.error(f"Error searching candidates for {symbol}: {e}")
            return []

    def get_fundamentals(self, symbol, statement_type='standalone'):
        """
        Fetches fundamental data (Complete Balance Sheet, P&L, etc) for a given symbol.
        Now fetches 10 years of data using 'Complete' methods.
        Supports statement_type: 'standalone' or 'consolidated'.
        """
        try:
            details = self.get_moneycontrol_details(symbol)
            if not details or not details.get('url'):
                return {"error": "Symbol URL not found in MoneyControl"}

            mc_url = details['url']
            logger.info(f"Fetching complete fundamentals ({statement_type}) for {symbol} (URL: {mc_url})")
            
            # Fetch all complete statement types (10 Years)
            # BS and PL definitely support statement_type
            
            bs_df = self.mc.get_complete_balance_sheet(mc_url, statement_type=statement_type, num_years=10)
            pl_df = self.mc.get_complete_profit_loss(mc_url, statement_type=statement_type, num_years=10)
            
            # Cash flow: Attempt to pass statement_type
            try:
                cf_df = self.mc.get_complete_cashflow_statement(mc_url, statement_type=statement_type, num_years=10)
            except TypeError:
                try:
                    # Maybe supports statement_type but not num_years?
                    cf_df = self.mc.get_complete_cashflow_statement(mc_url, statement_type=statement_type)
                except TypeError:
                    # Fallback: ignores statement_type
                    cf_df = self.mc.get_complete_cashflow_statement(mc_url)
                
            try:
                # Ratios likely don't have consolidated/standalone split usually, but let's try
                ratios_df = self.mc.get_complete_ratios_data(mc_url, statement_type=statement_type, num_years=10)
            except TypeError:
                try:
                    ratios_df = self.mc.get_complete_ratios_data(mc_url, num_years=10)
                except TypeError:
                    try:
                        ratios_df = self.mc.get_complete_ratios_data(mc_url)
                    except:
                        # Fallback to mini if complete fails
                        ratios_df = self.mc.get_ratios_mini_statement(details['id'])

            def clean_and_convert(df):
                if df is None or df.empty:
                    return []
                
                # Normalize the first column name to 'headers'
                if len(df.columns) > 0:
                    df = df.rename(columns={df.columns[0]: 'headers'})
                
                # Replace NaNs with None/null
                df = df.where(pd.notnull(df), None)
                return df.to_dict(orient="records")
            
            data = {
                "balance_sheet": clean_and_convert(bs_df),
                "profit_loss": clean_and_convert(pl_df),
                "cash_flow": clean_and_convert(cf_df),
                "ratios": clean_and_convert(ratios_df),
                "meta": {"type": statement_type}
            }
            
            return data

        except Exception as e:
            logger.error(f"Error fetching fundamentals for {symbol}: {e}")
            return {"error": str(e)}

# Singleton instance
market_data_service = MarketDataService()
