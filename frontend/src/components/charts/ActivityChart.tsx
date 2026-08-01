import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { CognitiveMetrics } from "../../api/types";

interface ActivityChartProps {
  data: CognitiveMetrics["dailyFocusLogs"];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as CognitiveMetrics["dailyFocusLogs"][number];
                return (
                  <div className="bg-gray-900 text-white text-xs rounded-xl p-2.5 shadow-lg border border-gray-700">
                    <p>{item.day}</p>
                    <p className="text-amber-300">{item.mindfulHours} hrs Mindful Focus</p>
                    <p className="text-gray-400">{item.intentionality}% Intentionality</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="mindfulHours" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.mindfulHours > 3 ? '#f59e0b' : '#3f3f46'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
