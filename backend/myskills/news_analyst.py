import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import re

class NewsAnalyst:
    def __init__(self, stock_name):
        # We use Stock Name (e.g. "Reliance Industries") for better Google News results than ticker
        self.query = f"{stock_name} share news"
        self.sentiment_score = 0
        self.articles = []

    def fetch_news(self):
        """Fetches news from Google News RSS"""
        try:
            url = f"https://news.google.com/rss/search?q={self.query}&hl=en-IN&gl=IN&ceid=IN:en"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                root = ET.fromstring(resp.content)
                self.articles = []
                for item in root.findall('./channel/item')[:5]: # Top 5
                    self.articles.append({
                        'title': item.find('title').text,
                        'link': item.find('link').text,
                        'pubDate': item.find('pubDate').text,
                        'source': item.find('source').text if item.find('source') is not None else 'Google News'
                    })
                return True
        except Exception as e:
            print(f"News Fetch Error: {e}")
            return False

    def analyze_sentiment(self):
        """
        Rule-based sentiment analysis on headlines.
        Returns: {score, label, summary_text}
        """
        if not self.articles:
            return None

        # Simple Keyword Dictionary
        positive_words = ['surge', 'jump', 'rise', 'gain', 'bull', 'buy', 'high', 'profit', 'growth', 'up', 'soar', 'record', 'strong', 'outperform']
        negative_words = ['fall', 'drop', 'slide', 'crash', 'bear', 'sell', 'low', 'loss', 'down', 'plunge', 'weak', 'miss', 'regulatory', 'ban', 'fine']

        score = 0
        hits = 0
        
        for article in self.articles:
            title = article['title'].lower()
            
            # Simple scoring
            p_count = sum(1 for w in positive_words if w in title)
            n_count = sum(1 for w in negative_words if w in title)
            
            if p_count > n_count:
                score += 1
            elif n_count > p_count:
                score -= 1
            
            if p_count or n_count:
                hits += 1

        # Normalize
        final_label = "Neutral"
        if score > 0: final_label = "Bullish"
        if score < 0: final_label = "Bearish"
        if score > 2: final_label = "Strong Bullish"
        if score < -2: final_label = "Strong Bearish"

        # Generate Insights Text
        top_headlines = [f"- {a['title']} ({a['source']})" for a in self.articles[:3]]
        headlines_text = "\n".join(top_headlines)
        
        insight_text = (
            f"NEWS SENTIMENT: {final_label} (Score: {score}).\n"
            f"HEADLINES:\n{headlines_text}"
        )

        return {
            "label": final_label,
            "score": score,
            "text": insight_text,
            "articles": self.articles
        }

if __name__ == "__main__":
    analyst = NewsAnalyst("Reliance Industries")
    analyst.fetch_news()
    result = analyst.analyze_sentiment()
    print(result['text'])
