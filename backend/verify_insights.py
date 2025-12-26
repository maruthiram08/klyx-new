import pandas as pd

output_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/nifty50_final_analysis.xlsx'

try:
    df = pd.read_excel(output_file)
    print(df[['Stock Name', 'Financial Insights']].head(5).to_string())
    
    empty_insights = df[df['Financial Insights'] == "Could not generate insights."]
    if not empty_insights.empty:
        print(f"\nWARNING: {len(empty_insights)} rows failed generation.")
    else:
        print("\nSUCCESS: All rows have insights.")
        
except Exception as e:
    print(f"Error: {e}")
