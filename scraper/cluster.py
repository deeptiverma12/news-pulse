import psycopg2
import os
import numpy as np
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

def get_db():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def get_articles():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, title, summary, body FROM articles WHERE cluster_id IS NULL")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def build_text(title, summary, body):
    parts = [title or "", summary or "", (body or "")[:500]]
    return " ".join(parts)

def cluster_articles():
    articles = get_articles()
    if not articles:
        print("No unclustered articles found!")
        return

    print(f"Clustering {len(articles)} articles...")

    ids = [a[0] for a in articles]
    texts = [build_text(a[1], a[2], a[3]) for a in articles]

    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(texts)

    similarity = cosine_similarity(tfidf_matrix)

    threshold = 0.15
    clusters = []
    assigned = {}

    for i in range(len(articles)):
        if i in assigned:
            continue
        cluster = [i]
        for j in range(i + 1, len(articles)):
            if j not in assigned and similarity[i][j] >= threshold:
                cluster.append(j)
                assigned[j] = True
        assigned[i] = True
        clusters.append(cluster)

    print(f"Found {len(clusters)} clusters")

    conn = get_db()
    cur = conn.cursor()

    for cluster in clusters:
        cluster_texts = " ".join([texts[i] for i in cluster])
        temp_vec = TfidfVectorizer(stop_words="english", max_features=10)
        temp_vec.fit_transform([cluster_texts])
        top_words = list(temp_vec.vocabulary_.keys())[:3]
        label = " | ".join(top_words).title() if top_words else "General News"

        article_ids = [ids[i] for i in cluster]

        cur.execute("""
            SELECT MIN(published_at), MAX(published_at)
            FROM articles WHERE id = ANY(%s)
        """, (article_ids,))
        earliest, latest = cur.fetchone()

        cur.execute("""
            INSERT INTO clusters (label, article_count, earliest_article, latest_article)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (label, len(article_ids), earliest, latest))
        cluster_id = cur.fetchone()[0]

        cur.execute("""
            UPDATE articles SET cluster_id = %s WHERE id = ANY(%s)
        """, (cluster_id, article_ids))

    conn.commit()
    cur.close()
    conn.close()
    print("Clustering done!")

if __name__ == "__main__":
    cluster_articles()