import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver

# Ensure env vars are loaded
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
        "You are the Aura Finance AI Stock Assistant. "
        "You help users analyze stocks, check prices, technicals, and news. "
        "Always use the search_stocks tool if you are unsure of a ticker symbol. "
        "For Indian stocks, prefer the .NS (NSE) suffix. "
        "Provide concise, professional, and data-driven insights. "
        "If multiple tools are needed for a complex query (like comparison), use them in parallel or sequence."
    )

    agent = create_react_agent(
        model, 
        tools, 
        checkpointer=memory,
        state_modifier=system_message
    )
    
    return agent

# Singleton instance
ai_agent = None

def get_ai_agent():
    global ai_agent
    if ai_agent is None:
        ai_agent = get_agent_executor()
    return ai_agent
