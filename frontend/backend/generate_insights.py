import pandas as pd
import json
import os
import sys

# Add local directory to path to import skill
sys.path.append('/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend')

# Import the skill's modules
# We need to adapt the import because the files are in 'myskills'
from myskills.calculate_ratios import FinancialRatioCalculator, generate_summary, interpret_technical_snapshot
from myskills.technical_analyst import TechnicalAnalyst
from myskills.news_analyst import NewsAnalyst

input_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/nifty50_enriched.xlsx'
output_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/backend/nifty50_final_analysis.xlsx'

# [Keep map_row_to_skill_format unchanged]
def map_row_to_skill_format(row):
    """
    Maps our Excel row (unified + enriched) to the dictionary format expected by the Skill.
    """
    
    # 1. Income Statement (We use TTM/Annual values from our dataset where available)
    income_statement = {
        # Estimate Revenue from ratios if possible, or use placeholders if only ratio is needed
        "revenue": row.get('Operating Revenue Annual', 0), 
        "net_income": row.get('Net Profit Annual', 0),
        "operating_income": row.get('Operating Profit Annual', 0), # Might default to 0 if missing
        "ebit": row.get('Operating Profit Annual', 0), # Proxy
        "interest_expense": 1, # Avoid div/0 if missing
    }
    
    # 2. Balance Sheet (From Enriched Data)
    balance_sheet = {
        "total_assets": row.get('YF_TotalAssets', 0),
        "current_assets": row.get('YF_CurrentAssets', 0),
        "total_debt": row.get('YF_TotalDebt', 0),
        "current_liabilities": row.get('YF_CurrentLiabilities', 0),
        "shareholders_equity": row.get('YF_StockholdersEquity', 0),
        # Required for Quick Ratio (assuming 0 if missing as we didn't fetch inventory explicitly)
        "inventory": 0, 
        "cash_and_equivalents": 0 
    }
    
    # 3. Market Data
    market_data = {
        "share_price": row.get('Current Price', 0),
        # Calculate shares outstanding if missing: Market Cap / Price
        "shares_outstanding": row.get('Market Capitalization', 0) / row.get('Current Price', 1) if row.get('Current Price', 1) > 0 else 0,
        "earnings_growth_rate": (row.get('Revenue Growth Annual YoY %', 0) or 0) / 100
    }
    
    return {
        "income_statement": income_statement,
        "balance_sheet": balance_sheet,
        "market_data": market_data,
        "cash_flow": {} # We don't have this yet
    }

def main():
    print("Generating insights (Fundamental + Hybrid Technicals)...")
    df = pd.read_csv(input_file) if input_file.endswith('.csv') else pd.read_excel(input_file)
    
    # Initialize Insight Columns
    df['Financial Insights'] = ""
    df['Tech_Trend'] = "Unknown"
    df['Tech_RSI'] = None
    df['Tech_MACD'] = "Unknown"
    df['News_Sentiment'] = "Neutral"
    df['News_Score'] = 0
    df['News_Headlines'] = "[]"
    
    for i, row in df.iterrows():
        try:
            # --- 1. FUNDAMENTAL ANALYSIS ---
            skill_input = map_row_to_skill_format(row)
            calculator = FinancialRatioCalculator(skill_input)
            all_ratios = calculator.calculate_all_ratios()
            
            # Fundamental Overrides from Excel
            if row.get('ROE Annual %', 0):
                all_ratios['profitability']['roe'] = row['ROE Annual %'] / 100
            if row.get('Operating Profit Margin Qtr %', 0):
                 all_ratios['profitability']['operating_margin'] = row['Operating Profit Margin Qtr %'] / 100
            if row.get('PE TTM Price to Earnings', 0):
                all_ratios['valuation']['pe_ratio'] = row['PE TTM Price to Earnings']
                
            fundamental_summary = generate_summary(all_ratios)
            
            # --- 2. TECHNICAL ANALYSIS (HYBRID) ---
            technical_summary = ""
            tech_data = None
            
            # Strategy A: Use SNAPSHOT data from Excel
            excel_technicals = interpret_technical_snapshot(row)
            
            # Check if Excel data is "Complete" (Has Trend, RSI, and MACD)
            is_excel_complete = False
            if excel_technicals:
                # Basic check: do we have valid values?
                if (excel_technicals.get('trend') != 'Unknown' and 
                    pd.notna(excel_technicals.get('rsi', {}).get('value')) and 
                    pd.notna(excel_technicals.get('macd', {}).get('value'))):
                    is_excel_complete = True
            
            if is_excel_complete:
                tech_data = excel_technicals
                technical_summary = f"\n\nTECHNICALS (Snapshot): {tech_data['summary_text']}"
            else:
                # Strategy B: Dynamic Fetch via Yahoo (Fallback if Excel is missing or partial)
                nse_code = str(row.get('NSE Code', ''))
                # Handle cases where NSE Code might be formatted like "RELIANCE.NS" already or just "RELIANCE"
                if nse_code and nse_code != 'nan':
                    ticker = nse_code if nse_code.endswith('.NS') else f"{nse_code}.NS"
                    print(f"  Fetching Live Technicals for {ticker} (Excel data incomplete)...")
                    
                    try:
                        tech_analyst = TechnicalAnalyst(ticker)
                        live_tech_data = tech_analyst.analyze()
                        
                        if live_tech_data:
                            tech_data = live_tech_data
                            technical_summary = (
                                f"\n\nTECHNICALS (Live): Trend is {tech_data['trend']}. "
                                f"RSI is {tech_data['rsi']['value']} ({tech_data['rsi']['state']}). "
                                f"MACD is {tech_data['macd']['signal']}."
                            )
                    except Exception as e:
                        print(f"    Failed to fetch live technicals: {e}")
            
            # Save Structured Technicals (Merge or Overwrite)
            if tech_data:
                df.at[i, 'Tech_Trend'] = tech_data.get('trend', 'Unknown')
                
                # RSI
                if 'rsi' in tech_data and isinstance(tech_data['rsi'], dict):
                     df.at[i, 'Tech_RSI'] = tech_data['rsi'].get('value')
                     df.at[i, 'Tech_RSI_State'] = tech_data['rsi'].get('state')
                
                # MACD
                if 'macd' in tech_data and isinstance(tech_data['macd'], dict):
                     df.at[i, 'Tech_MACD'] = tech_data['macd'].get('value')
                     df.at[i, 'Tech_MACD_Signal'] = tech_data['macd'].get('signal')
                
                # MFI [NEW]
                if 'mfi' in tech_data and isinstance(tech_data['mfi'], dict):
                    df.at[i, 'Tech_MFI'] = tech_data['mfi'].get('value')
                    
                # Volume [NEW]
                if 'volume_analysis' in tech_data and isinstance(tech_data['volume_analysis'], dict):
                    df.at[i, 'Tech_Vol_Signal'] = tech_data['volume_analysis'].get('signal')
                    df.at[i, 'Tech_Vol_Pct'] = tech_data['volume_analysis'].get('pct_vs_avg')

            
            # --- 3. NEWS ANALYSIS (NEW) ---
            news_summary = ""
            stock_name = str(row.get('Stock Name', '')).strip()
            if stock_name and stock_name != 'nan':
                 # print(f"  Fetching News for {stock_name}...") # Reduce spam
                 news_analyst = NewsAnalyst(stock_name)
                 if news_analyst.fetch_news():
                     news_result = news_analyst.analyze_sentiment()
                     if news_result:
                         news_summary = f"\n\n{news_result['text']}"
                         
                         # Save Structured News Data
                         df.at[i, 'News_Sentiment'] = news_result['label']
                         df.at[i, 'News_Score'] = news_result['score']
                         df.at[i, 'News_Headlines'] = json.dumps(news_result['articles'])

            # Combine
            full_insight = fundamental_summary + technical_summary + news_summary
            df.at[i, 'Financial Insights'] = full_insight
            
        except Exception as e:
            print(f"Error on row {i}: {e}")
            df.at[i, 'Financial Insights'] = "Could not generate insights."

    print(f"Saving to {output_file}...")
    df.to_excel(output_file, index=False)
    print("Done.")

if __name__ == "__main__":
    main()
