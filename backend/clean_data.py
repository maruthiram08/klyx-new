import pandas as pd
import os
import re

# Configuration
backend_dir = os.path.dirname(os.path.abspath(__file__))
directory = os.path.join(backend_dir, 'datasource')
output_file = os.path.join(backend_dir, 'nifty50_unified_master.xlsx')
enriched_file = os.path.join(backend_dir, 'nifty50_enriched.xlsx')
test_file_prefix = 'test_'

def get_source_files():
    all_files = os.listdir(directory)
    valid_files = []
    has_user_files = False
    
    # First pass: Identify potential user files
    print("Scanning for User Files...")
    for f in all_files:
        if f.endswith(('.xlsx', '.csv')) and not f.startswith('.') and not f.startswith('~$'):
            if os.path.join(directory, f) not in [output_file, enriched_file]:
                 if f not in ['nifty50_unified_master.xlsx', 'nifty50_enriched.xlsx', 'nifty50_final_analysis.xlsx']:
                     if not f.startswith(test_file_prefix):
                         print(f"  Found User File: {f}")
                         has_user_files = True
                     else:
                         print(f"  Found Test File: {f}")

    # Second pass: Collect appropriate files
    print(f"User Files Detected: {has_user_files}. Filtering...")
    for f in all_files:
        if f.endswith(('.xlsx', '.csv')) and not f.startswith('.') and not f.startswith('~$'):
             if os.path.join(directory, f) not in [output_file, enriched_file]:
                 if f not in ['nifty50_unified_master.xlsx', 'nifty50_enriched.xlsx', 'nifty50_final_analysis.xlsx']:
                     # Logic: If user files exist, SKIP test files. Else, include them.
                     if has_user_files and f.startswith(test_file_prefix):
                         print(f"  Skipping Test File (User files present): {f}")
                         continue
                     valid_files.append(f)
                     
    return valid_files

# files = [
#     'nifty50 technicals.xlsx',
#     'nifty50-forecasts.xlsx',
#     'nifty50-fundamentals.xlsx',
#     'nifty50-trendlynescores, benchmarks.xlsx'
# ]


# High-Value Identifiers to prevent duplication
# We keep these in the master (first file) and drop them from subsequent files
common_identifiers = [
    'NSE Code', 'BSE Code', 'Stock Code', 'ISIN', 
    'Industry Name', 'sector_name', 
    'Current Price', 'Market Capitalization'
]

def clean_columns(df, filename):
    """
    Removes columns ending with .1, .2, etc., which are often artifacts of duplicate headers.
    """
    cols_to_drop = [c for c in df.columns if re.search(r'\.\d+$', c)]
    if cols_to_drop:
        print(f"[{filename}] Dropping artifact columns: {cols_to_drop}")
        df.drop(columns=cols_to_drop, inplace=True)
    return df

def main():
    print("--- Starting Data Cleaning & Unification ---")
    
    dataframes = {}
    
    # 1. Load and Standardize
    files = get_source_files()
    print(f"Detected Source Files: {files}")
    
    if not files:
        print("No source files found!")
        return

    for file in files:
        path = os.path.join(directory, file)
        try:
            print(f"Loading {file}...")
            df = pd.read_excel(path)
            
            # Clean artifact columns
            df = clean_columns(df, file)
            
            # Set Index to Stock Name
            if 'Stock Name' not in df.columns:
                print(f"CRITICAL ERROR: 'Stock Name' not found in {file}. Skipping.")
                continue
                
            df.set_index('Stock Name', inplace=True)
            dataframes[file] = df
            print(f"Loaded {file}: Shape {df.shape}")
            
        except Exception as e:
            print(f"Error reading {file}: {e}")
            return

    # 2. Define Master
    # We use the first file in the list as the base
    master_file = files[0]
    master_df = dataframes[master_file]
    print(f"\nBase Master DataFrame established from {master_file} with shape {master_df.shape}")

    # 3. Merge Strategy
    for file in files[1:]:
        print(f"\nMerging {file}...")
        current_df = dataframes[file]
        
        # Identify columns to drop (Common Identifiers that are not the index)
        # Note: 'Stock Name' is already the index, so it won't be in columns
        cols_to_remove = [c for c in common_identifiers if c in current_df.columns]
        
        if cols_to_remove:
            print(f"Dropping redundant identifier columns: {cols_to_remove}")
            current_df.drop(columns=cols_to_remove, inplace=True)
            
        # Join
        # defaulting to outer join to preserve data if keys don't perfectly match (though we verified they do)
        master_df = master_df.join(current_df, how='outer', rsuffix=f'_{file}')
        print(f"New Master Shape: {master_df.shape}")

    # 4. Final Review & Save
    print(f"\nFinal Shape: {master_df.shape}")
    
    # Reset index to make Stock Name a column again
    master_df.reset_index(inplace=True)
    
    print(f"Saving to {output_file}...")
    master_df.to_excel(output_file, index=False)
    print("DONE: Data cleaning and unification complete.")

if __name__ == "__main__":
    main()
