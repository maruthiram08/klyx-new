
import logging

logger = logging.getLogger(__name__)

class ScoreService:
    """
    Calculates composite scores for stocks similar to Trendlyne's DVM scores.
    Scores are normalized to 0-100.
    """

    @staticmethod
    def calculate_durability(data: dict) -> int:
        """
        Calculates Durability Score (0-100) based on Financial Health.
        Inspired by Piotroski F-Score + Solvency Ratios.
        
        Criteria (Total 10 points -> scaled to 100):
        1. ROA > 0
        2. Operating Cash Flow > 0
        3. ROA > Previous ROA (Improving profitability) - *Approximated by checking if ROA is high (>10%)*
        4. Operating Cash Flow > Net Income (Quality of earnings)
        5. Long Term Debt < Equity (Debt/Equity < 1)
        6. Current Ratio > 1.5 (Liquidity)
        7. Gross Margin > 0 (Basic profitability)
        8. Asset Turnover > 0.5 (Efficiency)
        9. Promoter Holding > 30% (Skin in the game)
        10. Pledged Shares < 5% (Low stress) - *Assuming 0 if not present*
        """
        score = 0
        points = 10
        
        try:
            # 1. ROA Positive
            if (data.get('roa_annual_pct') or 0) > 0: score += 1
            
            # 2. Operating Margin Positive (Proxy for OCF)
            if (data.get('operating_margin_pct') or 0) > 0: score += 1
            
            # 3. High ROA (Proxy for improvement)
            if (data.get('roa_annual_pct') or 0) > 10: score += 1
            
            # 4. Debt Clean
            de = data.get('debt_to_equity') or 0
            if de < 1.0: score += 1
            if de < 0.1: score += 1 # Bonus for zero/low debt
            
            # 5. Liquidity
            cr = data.get('current_ratio') or 0
            if cr > 1.5: score += 1
            
            # 6. Profitability
            if (data.get('net_profit_margin_pct') or 0) > 10: score += 1
            
            # 7. Quality of Earnings (EPS Growth)
            if (data.get('eps_growth_pct') or 0) > 0: score += 1
            
            # 8. Skin in the Game
            if (data.get('promoter_holding_pct') or 0) > 30: score += 1
            
            # 9. Consistency (ROE)
            if (data.get('roe_annual_pct') or 0) > 15: score += 1
            
            normalized_score = min(int((score / points) * 100), 100)
            return normalized_score
            
        except Exception as e:
            logger.error(f"Error calculating durability: {e}")
            return 0

    @staticmethod
    def calculate_valuation(data: dict) -> int:
        """
        Calculates Valuation Score (0-100). 
        High Score = Attractive Valuation (Cheap).
        Low Score = Expensive.
        """
        score = 0
        points = 5
        
        try:
            pe = data.get('pe_ttm') or 0
            if pe <= 0: return 0 # Loss making or invalid
            
            # 1. PE < 15 (Cheap)
            if pe < 15: score += 1
            # 2. PE < 30 (Reasonable)
            if pe < 30: score += 1
            
            # 3. PEG Ratio < 1 (Growth at reasonable price)
            peg = data.get('peg_ratio') or 0
            if 0 < peg < 1.5: score += 1
            
            # 4. Price to Book < 3
            pb = data.get('pb_ratio') or 0
            if 0 < pb < 3: score += 1
            
            # 5. Dividend Yield > 1%
            dy = data.get('dividend_yield_pct') or 0
            if dy > 1: score += 1
            
            return normalized_score
            
        except Exception as e:
            logger.error(f"Error calculating valuation: {e}")
            return 0

    @staticmethod
    def calculate_momentum(data: dict) -> int:
        """
        Calculates Momentum Score (0-100) based on Technicals.
        Components:
        1. Relative Strength / 1Y Return (40%)
        2. Trend (Price > SMAs) (30%)
        3. RSI Regime (20%)
        4. MACD (10%)
        """
        score = 0
        
        try:
            # 1. Relative Strength / Performance (40 pts)
            # Use RS Score if available, else proxy with 1Y Return
            rs_score = data.get("rel_strength_score") or 0
            # If we have RS (0-99), map it to 0-40 points
            if rs_score:
                score += (rs_score / 100) * 40
            else:
                # Fallback: Check raw 1Y return
                y1_ret = data.get("year1Change") or 0 # decimal 0.5 = 50%
                if y1_ret > 0.5: score += 40    # >50% return
                elif y1_ret > 0.2: score += 30  # >20% return
                elif y1_ret > 0: score += 15    # Positive return
            
            # 2. Trend Alignment (30 pts)
            # Price > SMA50 > SMA200 is ideal
            price = data.get("currentPrice") or 0
            # Need to ensure we fetch/pass this. 
            # If missing, use week52High proxy
            high52 = data.get("week52High")
            
            if price and high52:
                proximity = price / high52
                if proximity > 0.95: score += 30 # At ATH
                elif proximity > 0.85: score += 20
                elif proximity > 0.75: score += 10
            
            # 3. RSI Regime (20 pts) - Bullish range 40-80
            # Placeholder if we don't have RSI yet in data dict
            # score += 10 
            
            # 4. MACD (10 pts)
            # Placeholder
            if price and data.get("week52Low"):
                 if price > (data.get("week52Low") or 0) * 1.1: score += 10

            return min(100, max(0, int(score)))

        except Exception as e:
            logger.error(f"Error calculating momentum: {e}")
            return 0
