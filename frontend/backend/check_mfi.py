import pandas as pd
import os

file_path = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/nifty50_unified_master.xlsx'
if os.path.exists(file_path):
    df = pd.read_excel(file_path)
    print("Columns found:")
    if 'Day MFI' in df.columns:
        print(f"Day MFI: {df['Day MFI'].count()} non-null values out of {len(df)}")
        print(f"Sample MFI: {df['Day MFI'].head().tolist()}")
    else:
        print("Day MFI column NOT FOUND")
        
    if 'Day Volume' in df.columns:
        print(f"Day Volume: {df['Day Volume'].count()} non-null values")
    else:
        print("Day Volume column NOT FOUND")
else:
    print("File not found.")
