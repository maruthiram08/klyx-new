
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class MomentumCalculator:
    """
    Calculates a synthetic Momentum Score (0-100) based on technical indicators.
    Used as a proxy for 'Trendlyne Momentum Score'.
    
    Formula:
    - RSI Strength (0-40 pts): RSI > 50 adds points.
    - Trend Strength (0-40 pts): Price vs SMAs.
    - Day Change (0-20 pts): Recent price action.
    """
    
    @staticmethod
    def calculate(data: Dict) -> int:
        try:
            score = 0
            
            # 1. RSI Component (Max 40)
            # RSI usually 0-100. Bullish is > 50, Strong > 70.
            rsi = float(data.get("rsi") or 50)
            if rsi > 50:
                # Map 50-70 to 0-30 points, >70 gets full 40.
                score += min(40, (rsi - 50) * 2)
            
            # 2. Moving Average Trend (Max 30)
            price = float(data.get("currentPrice") or 0)
            sma_50 = float(data.get("sma_50") or 0)
            sma_200 = float(data.get("sma_200") or 0)
            
            if price > 0:
                if sma_50 > 0 and price > sma_50:
                    score += 15
                if sma_200 > 0 and price > sma_200:
                    score += 15
            
            # 3. Recent Momentum / Day Change (Max 20)
            # Up to 20 points for positive daily movement
            change = float(data.get("dayChange") or 0)
            if change > 0:
                score += min(20, change * 2) # e.g. 5% gain = 10 pts
            
            # 4. Bonus for 52-week high Proximity (Max 10)
            high_52 = float(data.get("week52High") or 0)
            if price > 0 and high_52 > 0:
                distance = (high_52 - price) / high_52 # 0.1 means 10% away
                if distance < 0.1: # Within 10% of high
                    score += 10
                    
            return int(min(100, max(0, score)))
            
        except Exception as e:
            logger.debug(f"Momentum calculation failed: {e}")
            return 50 # Neutral default
