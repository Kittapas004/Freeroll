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
import { useState, useEffect } from "react";
import { FlaskConical } from "lucide-react";

interface ChemicalChartProps {
  batchDoucumentId?: string
}

export default function ChemicalChart({ batchDoucumentId }: ChemicalChartProps) {
  const [data, setData] = useState<{ name: string; standard: number; current: number }[]>([]);
  const [timeframe, setTimeframe] = useState("7d"); // Default timeframe (e.g., last 7 days)
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    console.log("Batch Document ID:", batchDoucumentId);
    console.log("Start Date:", getStartDate(timeframe));
    setLoading(true);
    try {
      const response = await fetch(
        `https://popular-trust-9012d3ebd9.strapiapp.com/api/harvest-records?populate=*&filters[batch][documentId][$eq]=${batchDoucumentId}&filters[Date][$gte]=${getStartDate(
          timeframe
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }

      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      console.log("Fetched data:", result.data);

      // Process the data to calculate averages for each unique date
      const records = result.data.map((record: any) => ({
        date: record.Date,
        curcumin_quality: record.Curcumin_quality,
      }));

      const granularity = getGranularity(timeframe);
      const groupedData = groupByGranularity(records, granularity);

      const chartData = Object.keys(groupedData).map((date) => {
        const values = groupedData[date];
        const average =
          values.reduce((sum, val) => sum + val, 0) / values.length;

        return {
          name: formatLabel(date, granularity),
          standard: 80,
          current: average,
          rawDate: date,
        };
      });

      // Sort chronologically
      chartData.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

      // Final shape
      setData(chartData.map(({ rawDate, ...rest }) => ({ ...rest, name: rest.name || "Unknown" })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const getStartDate = (timeframe: string) => {
    const now = new Date();
    if (timeframe === "7d") {
      now.setDate(now.getDate() - 7);
    } else if (timeframe === "30d") {
      now.setDate(now.getDate() - 30);
    } else if (timeframe === "90d") {
      now.setDate(now.getDate() - 90);
    } else if (timeframe === "1y") {
      now.setDate(now.getDate() - 365);
    }
    return now.toISOString().split("T")[0]; // Return date in YYYY-MM-DD format
  };

  const groupByGranularity = (
    records: { date: string; curcumin_quality: number }[],
    granularity: "daily" | "weekly" | "monthly"
  ) => {
    return records.reduce((acc: Record<string, number[]>, record) => {
      const date = new Date(record.date);
      let key = "";

      if (granularity === "daily") {
        key = date.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (granularity === "weekly") {
        const year = date.getUTCFullYear();
        const oneJan = new Date(Date.UTC(year, 0, 1));
        const week = Math.ceil(((+date - +oneJan) / 86400000 + oneJan.getUTCDay() + 1) / 7);
        key = `W${week}-${year}`; // Week 14-2025
      } else if (granularity === "monthly") {
        key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`; // 2025-3
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record.curcumin_quality);
      return acc;
    }, {});
  };

  const getGranularity = (timeframe: string): "daily" | "weekly" | "monthly" => {
    if (timeframe === "7d" || timeframe === "30d") return "daily";
    if (timeframe === "90d") return "weekly";
    return "monthly"; // 1y
  };

  const formatLabel = (key: string, granularity: "daily" | "weekly" | "monthly") => {
    if (granularity === "daily") {
      return new Date(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } else if (granularity === "weekly") {
      return key.replace("W", "Week ");
    } else if (granularity === "monthly") {
      const [year, month] = key.split("-");
      const date = new Date(Date.UTC(+year, +month - 1));
      return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    }
  };



  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span role="img" aria-label="lab">
            <FlaskConical className="text-green-600" size={16} />
          </span>{" "}
          Curcumin %
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs text-gray-400 border rounded px-2 py-1"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last 1 Year</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%" maxHeight={300}>
          <LineChart data={data} margin={{ left: -20 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[40, 85]} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="standard"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Standard Value"
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Current Value"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}