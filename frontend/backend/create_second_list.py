import pandas as pd
import os

data = {
    'Stock Name': [
        'Bajaj Finance Ltd.',
        'Bharti Airtel Ltd.',
        'Cipla Ltd.',
        'Divi\'s Laboratories Ltd.',
        'Eicher Motors Ltd.',
        'HCL Technologies Ltd.',
        'Hindustan Unilever Ltd.',
        'ITC Ltd.',
        'Maruti Suzuki India Ltd.',
        'Titan Company Ltd.'
    ]
}

df = pd.DataFrame(data)
output_path = '/Users/maruthi/Desktop/MainDirectory/weekendanalysis tool/datasource/user_list_10_stocks.xlsx'
df.to_excel(output_path, index=False)
print(f"Created {output_path}")
