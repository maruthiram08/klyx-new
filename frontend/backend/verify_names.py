import pandas as pd
import os

directory = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/datasource'
files = [
    'nifty50 technicals.xlsx',
    'nifty50-forecasts.xlsx',
    'nifty50-fundamentals.xlsx',
    'nifty50-trendlynescores, benchmarks.xlsx'
]

for file in files:
    path = os.path.join(directory, file)
    try:
        df = pd.read_excel(path)
        if 'Stock Name' in df.columns:
            duplicates = df[df.duplicated('Stock Name')]
            if not duplicates.empty:
                print(f"FAILED: Found duplicate Stock Names in {file}")
                print(duplicates['Stock Name'])
            else:
                print(f"SUCCESS: Stock Names are unique in {file}")
        else:
            print(f"WARNING: 'Stock Name' column not found in {file}")
            
    except Exception as e:
        print(f"Error: {e}")
