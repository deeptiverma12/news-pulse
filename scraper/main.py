from scraper import scrape_feed, save_articles, RSS_FEEDS
from cluster import cluster_articles

if __name__ == "__main__":
    print("=== Step 1: Scraping articles ===")
    all_articles = []
    for feed in RSS_FEEDS:
        articles = scrape_feed(feed)
        all_articles.extend(articles)
    save_articles(all_articles)

    print("\n=== Step 2: Clustering articles ===")
    cluster_articles()

    print("\n✅ All done!")