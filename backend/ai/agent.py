import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver

# Ensure env vars are loaded from .env.local or .env (project root)
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env.local")
load_dotenv(env_path)
load_dotenv()

# Relative import of tools
try:
    from .tools import tools
except ImportError:
    from ai.tools import tools
from config import config

def get_agent_executor():
    """
    Initializes and returns the LangGraph agent executor.
    """
    api_key = config.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in config or environment")

    # Initialize model
    model = ChatOpenAI(
        model=config.OPENAI_MODEL, 
        openai_api_key=api_key,
        streaming=True
    )

    # Initialize memory for thread-based state
    memory = InMemorySaver()

    # Create the agent
    # We add a system message to guide the assistant
    system_message = (
        "You are the Aura Finance AI Stock Assistant, a professional financial analyst with access to real-time market data, technical indicators, fundamental reports, and news sentiment.\n\n"
        "YOUR ROLE:\n"
        "- Provide accurate, data-backed stock analysis.\n"
        "- Explain market movements and trends clearly.\n"
        "- Offer contextual insights based on combined technical and fundamental data.\n"
        "- Help users identify risks and opportunities.\n\n"
        "CAPABILITIES & TOOLS:\n"
        "- get_stock_price: Current market price & currency.\n"
        "- get_technical_analysis: RSI, MACD, trends, support/resistance.\n"
        "- get_fundamentals: Balance sheet, P&L, ratios (use 'consolidated' or 'standalone').\n"
        "- get_stock_news: Recent headlines and sentiment.\n"
        "- get_stock_history: Historical price data for charts (required for 'chart' component).\n"
        "- search_stocks: Find correct ticker symbols (use this if unsure or if a ticker seems delisted).\n\n"
        "GUIDELINES:\n"
        "- For Indian stocks, ALWAYS prefer the .NS (NSE) suffix.\n"
        "- STOCK REBRANDING: Some stocks have recently changed names/tickers. For example, Zomato is now Eternal (ETERNAL.NS). If a user asks for Zomato, use ETERNAL.NS.\n"
        "- If a tool returns 'possibly delisted' or no data, proactively use search_stocks to find the new ticker.\n"
        "- Be concise but informative. Mention data sources and timeframes (e.g., '6-month trend').\n"
        "- If a query is complex (e.g., comparison), use multiple tools in parallel or sequence.\n"
        "- Include appropriate disclaimers: 'Past performance does not indicate future results. Markets are volatile.'\n\n"
        "VISUAL OUTPUT (GENUI) GUIDELINES:\n"
        "Enhance your responses with rich UI components using the following syntax:\n"
        ':::ui-component { "type": "stock-card", "data": { "symbol": "NSE_SYMBOL", "name": "FullName", "price": "₹Value", "change": PctChange, "score": QualityScore } } :::\n'
        ':::ui-component { "type": "comparison", "data": { "stocks": [{"symbol": "S1"}, {"symbol": "S2"}], "metrics": [{"label": "P/E", "values": ["15x", "20x"]}, {"label": "ROE", "values": ["12%", "18%"]}] } } :::\n'
        ':::ui-component { "type": "news", "data": { "items": [{"title": "Headline", "source": "Reuters", "time": "2h ago"}] } } :::\n'
        ':::ui-component { "type": "chart", "data": { "points": [{"time": "YYYY-MM-DD", "value": 120.5}], "period": "6mo" } } :::\n'
        "\nUSE CASES FOR COMPONENTS:\n"
        "- Use 'comparison' for all multi-stock side-by-side analysis.\n"
        "- Use 'stock-card' for individual company overviews.\n"
        "- Use 'chart' component by calling get_stock_history(ticker, period) tool to get real data points. NEVER invent chart data.\n"
        "- Use 'news' when providing headline summaries."
    )

    agent = create_react_agent(
        model, 
        tools, 
        checkpointer=memory,
        prompt=system_message
    )
    
    return agent

# Singleton instance
ai_agent = None

def get_ai_agent():
    global ai_agent
    if ai_agent is None:
        ai_agent = get_agent_executor()
    return ai_agent
