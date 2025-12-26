
try:
    from nsepython import nse_eq_symbols
    print("nsepython installed")
    symbols = nse_eq_symbols()
    print(f"Fetched {len(symbols)} symbols")
    print(f"First 5: {symbols[:5]}")
except ImportError:
    print("nsepython NOT installed")
except Exception as e:
    print(f"Error: {e}")
