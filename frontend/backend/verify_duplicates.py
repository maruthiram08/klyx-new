import pandas as pd
import os
import numpy as np

directory = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/datasource'
files = [
    'nifty50 technicals.xlsx',
    'nifty50-forecasts.xlsx',
    'nifty50-fundamentals.xlsx',
    'nifty50-trendlynescores, benchmarks.xlsx'
]

dataframes = {}
for file in files:
    path = os.path.join(directory, file)
    try:
        df = pd.read_excel(path)
        # normalize index to NSE Code
        if 'NSE Code' in df.columns:
            df.set_index('NSE Code', inplace=True)
            dataframes[file] = df
    except Exception as e:
        print(f"Error: {e}")

# Check Current Price consistency
print("Checking Current Price consistency...")
prices = pd.DataFrame()
for file, df in dataframes.items():
    if 'Current Price' in df.columns:
        prices[file] = df['Current Price']

print(prices.head())
print("\nDifferences (std dev across sources):")
print(prices.std(axis=1).describe())

# Check Market Capitalization consistency
print("\nChecking Market Capitalization consistency...")
mcaps = pd.DataFrame()
for file, df in dataframes.items():
    if 'Market Capitalization' in df.columns:
        mcaps[file] = df['Market Capitalization']

print(mcaps.head())
print("\nDifferences (std dev across sources):")
print(mcaps.std(axis=1).describe())
