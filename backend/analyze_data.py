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
    print(f"--- Analysis for {file} ---")
    try:
        df = pd.read_excel(path)
        print(f"Columns: {list(df.columns)}")
        print("\n")
    except Exception as e:
        print(f"Error reading {file}: {e}")
