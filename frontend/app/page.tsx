"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Timeline from "@/components/Timeline";
import ClusterDetail from "@/components/ClusterDetail";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [timeline, setTimeline] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeSources, setActiveSources] = useState(["BBC", "NPR", "Reuters"]);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");

  const fetchTimeline = async () => {
    const { data } = await axios.get(`${API}/timeline`);
    setTimeline(data);
  };

  useEffect(() => { fetchTimeline(); }, []);

  const toggleSource = (source: string) => {
    setActiveSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setStatus("Scraping latest news...");
    const { data } = await axios.post(`${API}/ingest/trigger`);
    const jobId = data.jobId;
    const interval = setInterval(async () => {
      const { data: jobData } = await axios.get(`${API}/ingest/status/${jobId}`);
      if (jobData.status === "done") {
        clearInterval(interval);
        setRefreshing(false);
        fetchTimeline();
        setStatus("✅ Timeline updated!");
        setTimeout(() => setStatus(""), 3000);
      } else if (jobData.status === "failed") {
        clearInterval(interval);
        setRefreshing(false);
        setStatus("❌ Refresh failed");
      }
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0d1326] px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              📰 News<span className="text-blue-400">Pulse</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              AI-powered topic clustering from live news feeds
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          >
            {refreshing ? "⏳ Refreshing..." : "🔄 Refresh News"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0d1326] border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Sources</p>
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-gray-500 text-xs mt-1">BBC · NPR · Reuters</p>
          </div>
          <div className="bg-[#0d1326] border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Topic Clusters</p>
            <p className="text-2xl font-bold text-blue-400">{timeline.length}</p>
            <p className="text-gray-500 text-xs mt-1">Auto-grouped by TF-IDF</p>
          </div>
          <div className="bg-[#0d1326] border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Algorithm</p>
            <p className="text-2xl font-bold text-green-400">TF-IDF</p>
            <p className="text-gray-500 text-xs mt-1">Cosine similarity clustering</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-gray-400 text-sm">Filter by source:</span>
          {["BBC", "NPR", "Reuters"].map((s) => (
            <button
              key={s}
              onClick={() => toggleSource(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeSources.includes(s)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {s}
            </button>
          ))}
          {status && <span className="ml-auto text-yellow-400 text-sm">{status}</span>}
        </div>

        {/* Timeline */}
        <Timeline
          data={timeline}
          activeSources={activeSources}
          onSelectCluster={setSelectedCluster}
        />

        <p className="text-gray-600 text-xs text-center mt-4">
          Click any bar on the timeline to explore articles in that topic cluster
        </p>
      </div>

      {selectedCluster && (
        <ClusterDetail
          clusterId={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />
      )}
    </main>
  );
}