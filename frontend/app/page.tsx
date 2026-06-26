"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Timeline from "@/components/Timeline";
import ClusterDetail from "@/components/ClusterDetail";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [timeline, setTimeline] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const fetchTimeline = async () => {
    const { data } = await axios.get(`${API}/timeline`);
    setTimeline(data);
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

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

        {/* Timeline */}
        <Timeline
          data={timeline}
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