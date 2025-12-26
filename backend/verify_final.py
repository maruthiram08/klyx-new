import pandas as pd

output_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/nifty50_unified_master.xlsx'

try:
    df = pd.read_excel(output_file)
    print(f"File loaded successfully.")
    print(f"Shape: {df.shape}")
    print(f"Columns: {len(df.columns)}")
    
    # Check for any remaining duplicates in column names (though pandas handles this by deduplicating on read, usually)
    duplicate_columns = df.columns[df.columns.duplicated()]
    if len(duplicate_columns) > 0:
        print(f"WARNING: Duplicate columns found: {duplicate_columns}")
    else:
        print("SUCCESS: No duplicate column headers found.")
        
    # Check for '.1' artifacts
    artifact_cols = [c for c in df.columns if str(c).endswith('.1') or str(c).endswith('.2')]
    if artifact_cols:
        print(f"WARNING: Potential artifact columns remaining: {artifact_cols}")
        print("This might be due to legitimate overlapping column names that were unique properties.")
    else:
        print("SUCCESS: No clean-up artifacts (.1, .2) found.")
        
    print("\nFirst 3 rows sample:")
    print(df[['Stock Name', 'Current Price', 'Market Capitalization']].head(3))

except Exception as e:
    print(f"Error verification failed: {e}")
