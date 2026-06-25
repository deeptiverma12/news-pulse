const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Store job statuses in memory
const jobs = {};

// GET /clusters
app.get("/clusters", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clusters ORDER BY latest_article DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /clusters/:id
app.get("/clusters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cluster = await pool.query("SELECT * FROM clusters WHERE id = $1", [id]);
    if (cluster.rows.length === 0) return res.status(404).json({ error: "Cluster not found" });

    const articles = await pool.query(
      "SELECT * FROM articles WHERE cluster_id = $1 ORDER BY published_at ASC",
      [id]
    );
    res.json({ ...cluster.rows[0], articles: articles.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /timeline
app.get("/timeline", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, label, article_count, earliest_article, latest_article,
       EXTRACT(EPOCH FROM (latest_article - earliest_article)) as duration_seconds
       FROM clusters ORDER BY earliest_article ASC`
    );
    const timeline = result.rows.map((c) => ({
      id: c.id,
      label: c.label,
      start: c.earliest_article,
      end: c.latest_article,
      articleCount: c.article_count,
      intensity: Math.min(10, c.article_count * 2),
    }));
    res.json(timeline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ingest/trigger
app.post("/ingest/trigger", async (req, res) => {
  const jobId = uuidv4();
  jobs[jobId] = { status: "running", startedAt: new Date() };

  const scraperPath = path.join(__dirname, "../scraper");
  const python = process.platform === "win32" ? "python" : "python3";

  const proc = spawn(python, ["main.py"], {
    cwd: scraperPath,
    env: { ...process.env },
  });

  proc.stdout.on("data", (data) => console.log(`[scraper] ${data}`));
  proc.stderr.on("data", (data) => console.error(`[scraper error] ${data}`));

  proc.on("close", (code) => {
    jobs[jobId].status = code === 0 ? "done" : "failed";
    jobs[jobId].finishedAt = new Date();
  });

  res.json({ jobId });
});

// GET /ingest/status/:jobId
app.get("/ingest/status/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));