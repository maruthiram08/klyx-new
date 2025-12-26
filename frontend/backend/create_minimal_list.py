import pandas as pd
import os

# Define the user's requested test data
# Note: For enrichment to work perfectly, we usually prefer 'NSE Code'.
# If only Stock Name is provided, our enrich_data.py might fail if it relies on NSE Code.
# Let's verify enrich_data.py logic:
#   ticker_name = str(row.get('Stock Name', ''))
#   nse_code = str(row.get('NSE Code', ''))
# If NSE Code is missing, it skips. 
# So we need to provide NSE Code or fix enrich_data.py to lookup NSE Code by Name.
# Since the User specifically asked "just upload just list of stocks.. nothing else",
# we should ideally robustify enrich_data.py to Find Ticker by Name.
# But for this test file creation, let's Start with what they asked.

data = {
    'Stock Name': [
        'Adani Enterprises Ltd.',
        'Adani Ports & Special Economic Zone Ltd.',
        'Apollo Hospitals Enterprise Ltd.',
        'Asian Paints Ltd.',
        'Axis Bank Ltd.'
    ]
}

df = pd.DataFrame(data)
output_path = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/datasource/user_list_minimal.xlsx'
df.to_excel(output_path, index=False)
print(f"Created {output_path}")
