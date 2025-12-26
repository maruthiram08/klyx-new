import pandas as pd

output_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/nifty50_unified_master.xlsx'
keywords = ['asset', 'liabilit', 'debt', 'equity', 'inventory', 'receivable']

try:
    df = pd.read_excel(output_file)
    cols = [c for c in df.columns if any(k in str(c).lower() for k in keywords)]
    print(f"Columns matching keywords {keywords}:")
    for c in cols:
        print(f"- {c}")
except Exception as e:
    print(e)
