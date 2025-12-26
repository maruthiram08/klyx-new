import pandas as pd
import os

def debug_excel():
    file_path = 'backend/nifty50_final_analysis.xlsx'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Reading {file_path}...")
    try:
        df = pd.read_excel(file_path)
        print("Columns found:")
        print(list(df.columns))
        
        # Check reliance row
        reliance = df[df['NSE Code'] == 'RELIANCE']
        if not reliance.empty:
            print("\n--- RELIANCE Data (Target Fields) ---")
            targets = ['Operating Revenue', 'Net Profit', 'Revenue Growth', 'Operating Profit Margin', 'RSI', 'MACD', 'SMA']
            row = reliance.iloc[0]
            for col in df.columns:
                if any(t.lower() in col.lower() for t in targets):
                    print(f"{col}: {row[col]}")
        else:
            print("RELIANCE not found in file.")

    except Exception as e:
        print(f"Error reading excel: {e}")

if __name__ == "__main__":
    debug_excel()
