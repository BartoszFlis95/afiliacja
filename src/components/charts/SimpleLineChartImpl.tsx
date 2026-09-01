"use client";

import { useId } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
  const gradientId = useId();
  // Wypełnienie gradientem pod linią wygląda dobrze tylko dla pojedynczej
  // serii — przy kilku nakładające się półprzezroczyste obszary robią się
  // nieczytelne, więc dla multi-line zostaje sama linia (+ legenda).
  const showAreaFill = lines.length === 1;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Brak danych do wyświetlenia
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        {showAreaFill && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lines[0].color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={lines[0].color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "#A1A1AA" }}
          tickLine={false}
          axisLine={{ stroke: "#F4F4F5" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#A1A1AA" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => formatValue(Number(value))}
          labelStyle={{ color: "#18181B", fontWeight: 600 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #F4F4F5",
            backgroundColor: "#fff",
            fontSize: 13,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {showAreaFill && (
          <Area
            type="monotone"
            dataKey={lines[0].dataKey}
            stroke="none"
            fill={`url(#${gradientId})`}
            legendType="none"
            tooltipType="none"
          />
        )}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            animationDuration={700}
            animationEasing="ease-out"
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
