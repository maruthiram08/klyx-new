import requests
import xml.etree.ElementTree as ET

def check_google_news():
    # Search for "Reliance Industries stock" on Google News (India DB)
    ticker = "Reliance Industries stock"
    url = f"https://news.google.com/rss/search?q={ticker}&hl=en-IN&gl=IN&ceid=IN:en"
    
    print(f"Fetching Google News RSS for: {ticker}")
    resp = requests.get(url)
    
    if resp.status_code == 200:
        root = ET.fromstring(resp.content)
        # Iterate over item tags
        count = 0
        for item in root.findall('./channel/item'):
            title = item.find('title').text
            pubDate = item.find('pubDate').text
            source = item.find('source').text
            print(f"[{source}] {title} ({pubDate})")
            count += 1
            if count >= 5:
                break
    else:
        print("Failed to fetch RSS")

if __name__ == "__main__":
    check_google_news()
