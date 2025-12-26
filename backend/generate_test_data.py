import pandas as pd
import os

source_dir = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/datasource'
files = [
    'nifty50 technicals.xlsx',
    'nifty50-forecasts.xlsx',
    'nifty50-fundamentals.xlsx',
    'nifty50-trendlynescores, benchmarks.xlsx'
]

def generate_subsets():
    print("Generating 5-row test subsets...")
    for file in files:
        source_path = os.path.join(source_dir, file)
        # Prefix with 'test_' for the new files
        target_path = os.path.join(source_dir, f"test_{file}")
        
        try:
            df = pd.read_excel(source_path)
            subset = df.head(5)
            subset.to_excel(target_path, index=False)
            print(f"Created {target_path} with {len(subset)} rows.")
        except Exception as e:
            print(f"Error processing {file}: {e}")

if __name__ == "__main__":
    generate_subsets()
