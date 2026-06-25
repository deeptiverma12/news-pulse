"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TimelineItem {
  id: number;
  label: string;
  start: string;
  end: string;
  articleCount: number;
  intensity: number;
}

interface Props {
  data: TimelineItem[];
  activeSources: string[];
  onSelectCluster: (id: number) => void;
}

export default function Timeline({ data, activeSources, onSelectCluster }: Props) {
  if (!data.length) return <p className="text-gray-400">Loading timeline...</p>;

  const chartData = data.map((item) => ({
    ...item,
    shortLabel: item.label.length > 18 ? item.label.slice(0, 18) + "..." : item.label,
    duration: Math.max(2, Math.round(
      (new Date(item.end).getTime() - new Date(item.start).getTime()) / 60000
    )),
  }));

  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

  return (
    <div className="bg-[#0d1326] border border-gray-800 rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1 text-gray-200">📊 Topic Timeline</h2>
      <p className="text-gray-500 text-xs mb-6">Click a bar to explore articles in that cluster</p>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 60, top: 5, bottom: 30 }}
        >
          <XAxis
            type="number"
            stroke="#374151"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            label={{ value: "Duration (minutes)", position: "insideBottom", offset: -15, fill: "#4b5563", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="shortLabel"
            width={180}
            stroke="#374151"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
            formatter={(value: any, name: any, props: any) => [
              `${props.payload.articleCount} article${props.payload.articleCount > 1 ? "s" : ""}`,
              "Articles"
            ]}
            labelFormatter={(label) => `📌 ${label}`}
          />
          <Bar dataKey="duration" radius={[0, 6, 6, 0]} cursor="pointer" oonClick={(d) => d.id && onSelectCluster(d.id as number)} minPointSize={6}>
            {chartData.map((entry, index) => (
              <Cell key={entry.id} fill={colors[index % colors.length]} opacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}