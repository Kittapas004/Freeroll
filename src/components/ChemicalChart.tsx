"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// rest of code...

  
  const data = [
    { name: "Apr", standard: 80, current: 44 },
    { name: "May", standard: 80, current: 48 },
    { name: "Jun", standard: 80, current: 52 },
    { name: "Jul", standard: 80, current: 58 },
    { name: "Aug", standard: 80, current: 63 },
    { name: "Sep", standard: 80, current: 68 },
    { name: "Oct", standard: 80, current: 72 },
  ];
  
  export default function ChemicalChart() {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span role="img" aria-label="lab">⚗️</span> Curcumin %
          </div>
          <div className="text-xs text-gray-400">April 6, 2025</div>
        </div>
  
        <ResponsiveContainer width="100%" height="100%" maxHeight={300}>
          <LineChart data={data} margin={{ left: -20 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[40, 85]} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="standard" stroke="#ef4444" strokeWidth={2} dot={false} name="Standard Value" />
            <Line type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} dot={false} name="Current Value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  