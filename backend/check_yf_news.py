import yfinance as yf
import json

def check_indian_news():
    ticker = "RELIANCE.NS"
    print(f"Fetching news for {ticker}...")
    stock = yf.Ticker(ticker)
    news = stock.news
    
    print(f"Found {len(news)} articles.")
    print(json.dumps(news[:3], indent=2))

if __name__ == "__main__":
    check_indian_news()
