"use client";

// recharts jest ciężkie (~100kB+) — leniwe ładowanie całego komponentu wykresu
// usuwa je z początkowego bundle'a strony i ładuje dopiero gdy wykres faktycznie
// się montuje. Props bez zmian — wszystkie miejsca użycia działają bez zmian.
import dynamic from "next/dynamic";

interface LineSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface SimpleLineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  lines: LineSeries[];
  format?: "number" | "currency";
  /** Własny formatter — używaj tylko z komponentu klienckiego, nie da się przekazać z Server Component. */
  valueFormatter?: (value: number) => string;
  height?: number;
}

export const SimpleLineChart = dynamic<SimpleLineChartProps>(
  () => import("./SimpleLineChartImpl").then((mod) => mod.SimpleLineChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-blue-50" />,
  }
);
