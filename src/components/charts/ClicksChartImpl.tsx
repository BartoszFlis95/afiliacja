"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ClicksChartProps {
  data: { date: string; clicks: number }[];
}

export function ClicksChart({ data }: ClicksChartProps) {
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Brak kliknięć z ostatnich 30 dni.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          allowDecimals={false}
          width={28}
        />
        {/* Style tooltipa muszą być inline (Recharts nie przyjmuje className),
            ale zmienne CSS działają w stylach inline — przeglądarka rozwiązuje
            je względem elementu, a tokeny dziedziczą się z :root/.dark.
            Wcześniej było tu białe tło i niemal czarny tekst, czyli w ciemnym
            motywie biały prostokąt na ciemnym wykresie. */}
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            backgroundColor: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
          labelFormatter={(label) => `Data: ${label}`}
          formatter={(value) => [value, "Kliknięcia"]}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="#2563EB"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
