"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Article {
  id: number;
  title: string;
  source: string;
  url: string;
  published_at: string;
  summary: string;
}

interface Cluster {
  id: number;
  label: string;
  article_count: number;
  earliest_article: string;
  latest_article: string;
  articles: Article[];
}

interface Props {
  clusterId: number;
  onClose: () => void;
}

export default function ClusterDetail({ clusterId, onClose }: Props) {
  const [cluster, setCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    axios.get(`${API}/clusters/${clusterId}`).then(({ data }) => setCluster(data));
  }, [clusterId]);

  if (!cluster) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-400">{cluster.label}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {cluster.article_count} articles
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl ml-4">
            X
          </button>
        </div>
        <div className="space-y-4">
          {cluster.articles.map((article) => (
            <div key={article.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white font-medium">
                  {article.source}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(article.published_at).toLocaleString()}
                </span>
              </div>
              <p className="text-white font-semibold">{article.title}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm">
                Read article
              </a>
              {article.summary && (
                <p className="text-gray-400 text-sm mt-2">{article.summary}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}