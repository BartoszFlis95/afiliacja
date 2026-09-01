"use client";

// recharts jest ciężkie (~100kB+) — leniwe ładowanie całego komponentu wykresu
// usuwa je z początkowego bundle'a strony i ładuje dopiero gdy wykres faktycznie
// się montuje. Props bez zmian — wszystkie miejsca użycia działają bez zmian.
import dynamic from "next/dynamic";

interface SimpleBarChartProps {
  data: { label: string; value: number }[];
  format?: "number" | "currency";
  /** Własny formatter — używaj tylko z komponentu klienckiego, nie da się przekazać z Server Component. */
  valueFormatter?: (value: number) => string;
  color?: string;
  height?: number;
}

export const SimpleBarChart = dynamic<SimpleBarChartProps>(
  () => import("./SimpleBarChartImpl").then((mod) => mod.SimpleBarChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-primary/10" />,
  }
);
