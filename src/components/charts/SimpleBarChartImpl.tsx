"use client";

import { useId } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface SimpleBarChartProps {
  data: { label: string; value: number }[];
  /** Nazwana strategia formatowania — bezpieczna do przekazania z Server Component (w przeciwieństwie do funkcji). */
  format?: "number" | "currency";
  /** Własny formatter — używaj tylko z komponentu klienckiego, nie da się przekazać z Server Component. */
  valueFormatter?: (value: number) => string;
  color?: string;
  height?: number;
}

export function SimpleBarChart({
  data,
  format = "number",
  valueFormatter,
  color = "#2563EB",
  height = 300,
}: SimpleBarChartProps) {
  const formatValue =
    valueFormatter ?? (format === "currency" ? formatCurrency : (v: number) => v.toLocaleString("pl-PL"));
  const gradientId = useId();
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
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        {/* Style tooltipa muszą być inline (Recharts nie przyjmuje className),
            ale zmienne CSS działają w stylach inline — przeglądarka rozwiązuje
            je względem elementu, a tokeny dziedziczą się z :root/.dark.
            Wcześniej było tu białe tło i niemal czarny tekst, czyli w ciemnym
            motywie biały prostokąt na ciemnym wykresie. */}
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          formatter={(value) => [formatValue(Number(value)), ""]}
          labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600 }}
          itemStyle={{ color: "hsl(var(--popover-foreground))" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--popover))",
            fontSize: 13,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        />
        <Bar
          dataKey="value"
          fill={`url(#${gradientId})`}
          radius={[6, 6, 0, 0]}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
