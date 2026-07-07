"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface LineSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface SimpleLineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  lines: LineSeries[];
  /** Nazwana strategia formatowania — bezpieczna do przekazania z Server Component (w przeciwieństwie do funkcji). */
  format?: "number" | "currency";
  /** Własny formatter — używaj tylko z komponentu klienckiego, nie da się przekazać z Server Component. */
  valueFormatter?: (value: number) => string;
  height?: number;
}

export function SimpleLineChart({
  data,
  xKey,
  lines,
  format = "number",
  valueFormatter,
  height = 300,
}: SimpleLineChartProps) {
  const formatValue =
    valueFormatter ?? (format === "currency" ? formatCurrency : (v: number) => v.toLocaleString("pl-PL"));
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-400"
        style={{ height }}
      >
        Brak danych do wyświetlenia
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#DBEAFE" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={{ stroke: "#DBEAFE" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => formatValue(Number(value))}
          labelStyle={{ color: "#0F172A", fontWeight: 600 }}
          contentStyle={{ borderRadius: 8, border: "1px solid #DBEAFE", backgroundColor: "#fff", fontSize: 13 }}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
