import pandas as pd

output_file = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/nifty50_unified_master.xlsx'
try:
    df = pd.read_excel(output_file)
    print(list(df.columns))
except Exception as e:
    print(e)
