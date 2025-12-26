import pandas as pd
import os

file_path = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/nifty50_unified_master.xlsx'

if os.path.exists(file_path):
    df = pd.read_excel(file_path)
    print(f"Total Columns: {len(df.columns)}")
    print("Columns List:")
    for col in sorted(df.columns):
        print(f" - {col}")
else:
    print("Unified master file not found.")
