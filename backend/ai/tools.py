import sys
import os
import yfinance as yf
from langchain_core.tools import tool

# Add parent directory to path to import services and skills
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Optional imports - these may not be available in all environments
try:
    from services.market_data_service import market_data_service
    HAS_MARKET_DATA = True
except ImportError:
    market_data_service = None
    HAS_MARKET_DATA = False
    print("WARNING: market_data_service not available")

try:
    from myskills.technical_analyst import TechnicalAnalyst
    HAS_TECHNICAL = True
except ImportError:
    TechnicalAnalyst = None
    HAS_TECHNICAL = False
    print("WARNING: TechnicalAnalyst not available")

try:
    from myskills.news_analyst import NewsAnalyst
    HAS_NEWS = True
except ImportError:
    NewsAnalyst = None
    HAS_NEWS = False
    print("WARNING: NewsAnalyst not available")

@tool
def get_stock_price(ticker: str):
    """
    Fetches the current stock price for a given ticker symbol.
    For Indian stocks, ensure to use .NS (NSE) or .BO (BSE) suffix if known, 
    otherwise the search_stocks tool can help find the right ticker.
    """
    try:
        stock = yf.Ticker(ticker)
        # Use fast_info to get real-time price if possible, or history
        info = stock.fast_info
        price = info.last_price if hasattr(info, 'last_price') else None
        
        if price is None:
            hist = stock.history(period="1d")
            if not hist.empty:
                price = hist['Close'].iloc[-1]
        
        if price:
            return {
                "ticker": ticker,
                "current_price": round(price, 2),
                "currency": info.currency if hasattr(info, 'currency') else "Unknown"
            }
        return {"error": f"Could not find price for {ticker}"}
    except Exception as e:
        return {"error": str(e)}

@tool
def get_technical_analysis(ticker: str):
    """
    Fetches technical indicators like RSI, MACD, and Trends for a given stock ticker.
    Ideal for 'Is this stock in an uptrend?' or 'Check RSI' type queries.
    """
    if not HAS_TECHNICAL:
        return {"error": "Technical analysis not available in this environment"}
    try:
        # Ensure it has .NS for Indian stocks if it looks like one and suffix is missing
        if ticker.isupper() and "." not in ticker:
            # Simple heuristic, search_stocks is better but this helps
            pass 
            
        analyst = TechnicalAnalyst(ticker)
        analysis = analyst.analyze()
        if analysis:
            return analysis
        return {"error": f"Technical analysis failed for {ticker}"}
    except Exception as e:
        return {"error": str(e)}

@tool
def get_stock_news(stock_name: str):
    """
    Fetches the latest news and sentiment for a stock name (e.g., 'Reliance Industries' or 'Apple Inc').
    Best used when the user asks 'What's the news on X?' or 'Why is Y falling?'.
    """
    if not HAS_NEWS:
        return {"error": "News analysis not available in this environment"}
    try:
        analyst = NewsAnalyst(stock_name)
        if analyst.fetch_news():
            result = analyst.analyze_sentiment()
            if result:
                return {
                    "sentiment": result['label'],
                    "sentiment_score": result['score'],
                    "headlines": [a['title'] for a in result['articles']],
                    "summary": result['text']
                }
        return {"error": f"No news found for {stock_name}"}
    except Exception as e:
        return {"error": str(e)}

@tool
def get_fundamentals(symbol: str, statement_type: str = 'standalone'):
    """
    Fetches complete fundamental data (Balance Sheet, P&L, Cash Flow, Ratios) for a stock.
    statement_type can be 'standalone' or 'consolidated'.
    Useful for 'Analyze the balance sheet' or 'Is this stock undervalued?' queries.
    """
    if not HAS_MARKET_DATA:
        return {"error": "Fundamental data not available in this environment"}
    try:
        data = market_data_service.get_fundamentals(symbol, statement_type=statement_type)
        if "error" in data:
            return data
            
        # We might want to summarize this for the LLM as it can be large
        # For now return a structured summary of key metrics from ratios
        ratios = data.get('ratios', [])
        summary = {
            "symbol": symbol,
            "type": statement_type,
            "key_metrics": ratios[:10] if ratios else "No ratio data found"
        }
        return summary
    except Exception as e:
        return {"error": str(e)}

@tool
def search_stocks(query: str):
    """
    Searches for stock ticker symbols based on a company name or partial symbol.
    Always use this if you are unsure of the exact ticker symbol (e.g., if user says 'Reliance').
    """
    if not HAS_MARKET_DATA:
        return {"error": "Stock search not available in this environment"}
    try:
        candidates = market_data_service.search_candidates(query)
        if candidates:
            return [
                {
                    "name": c.get('pdt_dis_nm'),
                    "symbol": c.get('nse_code'),
                    "id": c.get('id'),
                    "full_info": c
                } for c in candidates[:5]
            ]
        return {"error": f"No stocks found matching '{query}'"}
    except Exception as e:
        return {"error": str(e)}

@tool
def get_stock_history(ticker: str, period: str = "6mo"):
    """
    Fetches historical price data for charting.
    Period options: 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max.
    Returns a list of data points suitable for the 'chart' UI component.
    """
    try:
        stock = yf.Ticker(ticker)
        # Get history with auto-adjustment
        hist = stock.history(period=period)
        
        if hist.empty:
            return {"error": f"No history found for {ticker}"}
            
        # Resample to limit data points (approx 50-100 points max for efficiency)
        if len(hist) > 100:
            hist = hist.iloc[::len(hist)//50]
            
        points = []
        for date, row in hist.iterrows():
            points.append({
                "time": date.strftime("%Y-%m-%d"),
                "value": round(row['Close'], 2)
            })
            
        return {
            "symbol": ticker,
            "period": period,
            "points": points
        }
    except Exception as e:
        return {"error": str(e)}

# Export all tools
# Export all tools
tools = [get_stock_price, get_technical_analysis, get_stock_news, get_fundamentals, search_stocks, get_stock_history]
