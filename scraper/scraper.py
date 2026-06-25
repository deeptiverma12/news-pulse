import feedparser
import trafilatura
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime
import time

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

RSS_FEEDS = [
    {"name": "BBC", "url": "http://feeds.bbci.co.uk/news/rss.xml"},
    {"name": "NPR", "url": "https://feeds.npr.org/1001/rss.xml"},
    {"name": "Reuters", "url": "https://feeds.reuters.com/reuters/topNews"},
]

def get_db():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def fetch_full_text(url):
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            return trafilatura.extract(downloaded)
    except:
        pass
    return None

def parse_date(entry):
    for attr in ["published_parsed", "updated_parsed"]:
        val = getattr(entry, attr, None)
        if val:
            return datetime(*val[:6])
    return datetime.utcnow()

def scrape_feed(feed_info):
    print(f"Scraping {feed_info['name']}...")
    feed = feedparser.parse(feed_info["url"])
    articles = []
    for entry in feed.entries[:15]:
        url = entry.get("link", "")
        title = entry.get("title", "")
        summary = entry.get("summary", "")
        published_at = parse_date(entry)
        print(f"  Fetching: {title[:60]}...")
        body = fetch_full_text(url)
        time.sleep(1)
        articles.append({
            "title": title,
            "summary": summary,
            "body": body,
            "source": feed_info["name"],
            "url": url,
            "published_at": published_at,
        })
    return articles

def save_articles(articles):
    conn = get_db()
    cur = conn.cursor()
    saved = 0
    for a in articles:
        try:
            cur.execute("""
                INSERT INTO articles (title, summary, body, source, url, published_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
            """, (a["title"], a["summary"], a["body"], a["source"], a["url"], a["published_at"]))
            if cur.rowcount > 0:
                saved += 1
        except Exception as e:
            print(f"Error saving article: {e}")
    conn.commit()
    cur.close()
    conn.close()
    print(f"Saved {saved} new articles")

if __name__ == "__main__":
    all_articles = []
    for feed in RSS_FEEDS:
        articles = scrape_feed(feed)
        all_articles.extend(articles)
    save_articles(all_articles)
    print("Scraping done!")