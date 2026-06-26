# 📰 News Pulse

AI-powered news aggregation and topic clustering app. It pulls live articles from multiple RSS feeds, groups related stories into topic clusters using TF-IDF + cosine similarity, and visualizes them on an interactive timeline.

Built as a take-home assessment for the Xponentium Technology Intern role.

---

## 🔗 Live Links

- **Frontend (Vercel):** https://news-pulse-p5jc.vercel.app
- **Backend API (Render):** https://news-pulse-backend-aa15.onrender.com
- **GitHub Repo:** https://github.com/deeptiverma12/news-pulse
- **Video Walkthrough:** _[add Loom link here]_

> Note: the backend is hosted on Render's free tier, which spins down after inactivity. The first request after idle time may take 30–50 seconds to respond while the server wakes up.

---

## 🧠 What It Does

1. A Python scraper pulls the latest articles from **BBC**, **NPR**, and **Reuters** RSS feeds.
2. It extracts the full article text (not just the RSS summary) using `trafilatura`.
3. Articles are converted into **TF-IDF vectors** and compared using **cosine similarity** to automatically group related stories into topic clusters — no manual tagging, no ML training required.
4. Everything is stored in a PostgreSQL database (Supabase).
5. A Node.js/Express API serves the clusters and articles.
6. A Next.js frontend renders an interactive horizontal-bar timeline — bar length shows how long a topic stayed in the news, and clicking a bar opens the full list of articles in that cluster, each linking back to the original source.
7. A "Refresh News" button on the frontend triggers a fresh scrape + re-cluster on demand.

---

## 🏗️ Architecture

```
RSS Feeds (BBC, NPR, Reuters)
        │
        ▼
Python Scraper (feedparser + trafilatura)
        │
        ▼
TF-IDF Clustering (scikit-learn, cosine similarity)
        │
        ▼
PostgreSQL Database (Supabase)
        │
        ▼
Node.js / Express API  ──────►  Next.js Frontend (Vercel)
   (Render)
```

| Layer      | Tech                                        | Why                                                                                               |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Scraper    | Python, `feedparser`, `trafilatura`         | Simple, reliable RSS parsing + full-text extraction                                               |
| Clustering | `scikit-learn` (TF-IDF + cosine similarity) | Groups articles by topic without needing labeled training data                                    |
| Database   | PostgreSQL (Supabase)                       | Articles and clusters are structured, relational data — a clean fit for SQL over a document store |
| Backend    | Node.js, Express                            | Lightweight REST API, easy to deploy on Render                                                    |
| Frontend   | Next.js, TypeScript, Tailwind, Recharts     | Component-based UI, one-click Vercel deployment, Recharts for the timeline visualization          |

---

## 🗂️ Project Structure

```
news-pulse/
├── scraper/          # Python: RSS scraping + TF-IDF clustering
│   ├── scraper.py
│   ├── cluster.py
│   └── main.py
├── backend/          # Node.js/Express API
│   └── index.js
└── frontend/         # Next.js app
    └── app/
        ├── page.tsx
        └── components/
            ├── Timeline.tsx
            └── ClusterDetail.tsx
```

---

## ⚙️ How Clustering Works (TF-IDF)

Each article's title + summary + first 500 characters of body is converted into a **TF-IDF vector** — a numeric representation where common words ("the", "is", "said") are weighted near zero, and distinctive, topic-specific words (e.g. "earthquake", "Caracas", "Venezuela") get high weight.

Every article is then compared against every other article using **cosine similarity**. If two articles score above a similarity threshold (0.15), they're grouped into the same cluster. Each cluster is auto-labeled using its top TF-IDF terms (e.g. _"Earthquakes | Hit | Caracas"_).

This means topic detection is fully automatic — no manual tagging, no pre-trained categories.

---

## 🔌 API Endpoints

| Method | Endpoint                | Description                                                                              |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/clusters`             | List all topic clusters                                                                  |
| GET    | `/clusters/:id`         | Get a single cluster with all its articles                                               |
| GET    | `/timeline`             | Cluster data formatted for the timeline chart (start/end time, article count, intensity) |
| POST   | `/ingest/trigger`       | Triggers a fresh scrape + re-cluster job, returns a `jobId`                              |
| GET    | `/ingest/status/:jobId` | Poll the status of a triggered scrape job (`running` / `done` / `failed`)                |

---

## 🖥️ Running Locally

### 1. Scraper

```bash
cd scraper
python -m venv venv
venv\Scripts\activate        # Windows
pip install feedparser trafilatura scikit-learn psycopg2-binary python-dotenv nltk requests
```

Create a `.env` file in `scraper/`:

```
DATABASE_URL=postgresql://your-supabase-connection-string
```

Run it:

```bash
python main.py
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql://your-supabase-connection-string
```

Run it:

```bash
node index.js
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Run it:

```bash
npm run dev
```

---

## 📌 Design Decisions & Honest Notes

- **TF-IDF over plain keyword overlap** — chosen because it weighs term importance rather than just counting shared words, giving noticeably better groupings (e.g. correctly separating "heatwave" articles from "earthquake" articles even when both mention common words like "people" or "country").
- **PostgreSQL over MongoDB** — the data (articles, clusters) is fixed-shape and relational (articles belong to clusters, clusters have date ranges), which SQL handles more naturally than a document store.
- **Single-article clusters** are expected behavior — if a story is unique enough that no other article crosses the similarity threshold, it stays its own cluster. This isn't a bug; it reflects genuinely standalone stories.
- **Render free-tier cold starts** — the backend may take up to 50 seconds to respond on the first request after a period of inactivity. A production version would use a paid tier or a keep-alive ping.
- **Cluster labels** are generated from raw top TF-IDF terms, so some labels can look slightly awkward (e.g. "Ve | Spent | 30"). With more time, this could be improved with better stopword filtering or short generated summaries instead of raw terms.

---

## 👩‍💻 Author

Deepti Verma
[LinkedIn](https://linkedin.com/in/deepti-verma-83193b280/) · [GitHub](https://github.com/deeptiverma12)
