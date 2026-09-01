"use client";

// recharts jest ciężkie (~100kB+) — leniwe ładowanie całego komponentu wykresu
// (nie pojedynczych named exports z recharts, bo AreaChart/XAxis/Tooltip muszą
// renderować się razem w jednym drzewie JSX) usuwa je z początkowego bundle'a
// strony i ładuje dopiero gdy wykres faktycznie się montuje.
import dynamic from "next/dynamic";

interface ClicksChartProps {
  data: { date: string; clicks: number }[];
}

export const ClicksChart = dynamic<ClicksChartProps>(
  () => import("./ClicksChartImpl").then((mod) => mod.ClicksChart),
  {
    ssr: false,
    loading: () => <div className="h-[220px] animate-pulse rounded-xl bg-primary/10" />,
  }
);
