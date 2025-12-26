import yfinance as yf
import pandas as pd
import numpy as np

class TechnicalAnalyst:
    def __init__(self, ticker):
        self.ticker = ticker
        self.data = pd.DataFrame()
        
    def fetch_data(self, period="1y"):
        """Fetches historical data from Yahoo Finance"""
        try:
            stock = yf.Ticker(self.ticker)
            self.data = stock.history(period=period)
            if self.data.empty:
                print(f"Warning: No data for {self.ticker}")
            return not self.data.empty
        except Exception as e:
            print(f"Error fetching data for {self.ticker}: {e}")
            return False

    def calculate_indicators(self):
        """Calculates suite of technical indicators"""
        df = self.data
        if df.empty:
            return {}

        # 1. Moving Averages
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        df['SMA_200'] = df['Close'].rolling(window=200).mean()
        df['EMA_12'] = df['Close'].ewm(span=12, adjust=False).mean()
        df['EMA_26'] = df['Close'].ewm(span=26, adjust=False).mean()
        
        # 2. MACD
        df['MACD'] = df['EMA_12'] - df['EMA_26']
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['Signal_Line']
        
        # 3. RSI (14-period)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # 4. Bollinger Bands (20-day, 2 std dev)
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        df['BB_Std'] = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (2 * df['BB_Std'])
        df['BB_Lower'] = df['BB_Middle'] - (2 * df['BB_Std'])
        
        # 5. ATR (14-period) - Volatility
        high_low = df['High'] - df['Low']
        high_close = np.abs(df['High'] - df['Close'].shift())
        low_close = np.abs(df['Low'] - df['Close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = np.max(ranges, axis=1)
        df['ATR'] = true_range.rolling(window=14).mean()

        return df

    def calculate_mfi(self, df, period=14):
        """Calculates Money Flow Index"""
        typical_price = (df['High'] + df['Low'] + df['Close']) / 3
        money_flow = typical_price * df['Volume']
        
        positive_flow = []
        negative_flow = []
        
        for i in range(len(typical_price)):
            if i == 0:
                positive_flow.append(0)
                negative_flow.append(0)
                continue
            
            if typical_price.iloc[i] > typical_price.iloc[i-1]:
                positive_flow.append(money_flow.iloc[i])
                negative_flow.append(0)
            elif typical_price.iloc[i] < typical_price.iloc[i-1]:
                positive_flow.append(0)
                negative_flow.append(money_flow.iloc[i])
            else:
                positive_flow.append(0)
                negative_flow.append(0)
                
        positive_mf = pd.Series(positive_flow, index=df.index).rolling(window=period).sum()
        negative_mf = pd.Series(negative_flow, index=df.index).rolling(window=period).sum()
        
        mfi = 100 - (100 / (1 + (positive_mf / negative_mf)))
        return mfi

    def analyze(self):
        """Generates a summary dictionary of the latest state"""
        if not self.fetch_data():
            return None
            
        df = self.calculate_indicators()
        
        # Add MFI
        df['MFI'] = self.calculate_mfi(df)
        
        # Add Volume Analysis
        df['Vol_1W_Avg'] = df['Volume'].rolling(window=5).mean()
        
        last = df.iloc[-1]
        
        # Interpret Signals
        trend = "Bullish" if last['Close'] > last['SMA_50'] else "Bearish"
        if last['Close'] > last['SMA_200']:
            trend += " (Long Term)"
            
        rsi_state = "Neutral"
        if last['RSI'] > 70: rsi_state = "Overbought"
        elif last['RSI'] < 30: rsi_state = "Oversold"
        
        macd_signal = "Bullish" if last['MACD'] > last['Signal_Line'] else "Bearish"
        
        # Volume Check
        vol_signal = "Normal"
        if last['Volume'] > (last['Vol_1W_Avg'] * 1.5):
            vol_signal = "High"
        elif last['Volume'] < (last['Vol_1W_Avg'] * 0.5):
            vol_signal = "Low"
            
        return {
            "current_price": last['Close'],
            "trend": trend,
            "rsi": {
                "value": round(last['RSI'], 2),
                "state": rsi_state
            },
            "macd": {
                "value": round(last['MACD'], 2),
                "signal": macd_signal
            },
            "mfi": {
                "value": round(last['MFI'], 2) if not pd.isna(last['MFI']) else 50
            },
            "volume_analysis": {
                "signal": vol_signal,
                "pct_vs_avg": round((last['Volume'] / last['Vol_1W_Avg'] - 1) * 100, 1) if last['Vol_1W_Avg'] > 0 else 0
            },
            "bollinger": {
                "upper": round(last['BB_Upper'], 2),
                "lower": round(last['BB_Lower'], 2),
                "width_pct": round((last['BB_Upper'] - last['BB_Lower']) / last['BB_Middle'] * 100, 2)
            },
            "support_resistance": {
                "sma_50": round(last['SMA_50'], 2),
                "sma_200": round(last['SMA_200'], 2)
            },
            "volatility_atr": round(last['ATR'], 2)
        }

if __name__ == "__main__":
    # Test
    analyst = TechnicalAnalyst("RELIANCE.NS")
    analysis = analyst.analyze()
    import json
    print(json.dumps(analysis, indent=2))
