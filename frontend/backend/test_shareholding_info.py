import yfinance as yf

def check_info():
    t = yf.Ticker("RELIANCE.NS")
    info = t.info
    print("--- INFO KEYS RELATING TO HOLDING ---")
    for k, v in info.items():
        if 'held' in k.lower() or 'hold' in k.lower() or 'promoter' in k.lower():
            print(f"{k}: {v}")

check_info()
