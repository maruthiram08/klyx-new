import pandas as pd
import os

def check_enriched():
    file_path = 'backend/nifty50_final_analysis.xlsx'
    if not os.path.exists(file_path):
        print("File not found.")
        return

    df = pd.read_excel(file_path)
    print("Columns:", list(df.columns))
    
    # Check Qtr columns
    cols = ['NSE Code', 'Tech_RSI_State', 'Tech_MACD_Signal']
    print("\n--- Sample Data ---")
    for i, row in df.iterrows():
        print(f"{row['NSE Code']}:")
        print(f"  RSI State: {row.get('Tech_RSI_State')}")
        print(f"  Promoter: {row.get('Promoter holding latest %')}")
        print(f"  Institution: {row.get('Institutional holding current Qtr %')}")

if __name__ == "__main__":
    check_enriched()
