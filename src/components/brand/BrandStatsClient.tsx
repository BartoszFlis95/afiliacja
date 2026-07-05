"use client";

import { useState, useTransition } from "react";

import { getBrandRangeStatsAction, type BrandRangeStats } from "@/actions/brand.actions";
import { DateRangeFilter, type DateRangeDays } from "@/components/shared/DateRangeFilter";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function BrandStatsClient({ initialData }: { initialData: BrandRangeStats }) {
  const [days, setDays] = useState<DateRangeDays>(30);
  const [data, setData] = useState<BrandRangeStats>(initialData);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: DateRangeDays) {
    setDays(value);
    startTransition(async () => {
      const result = await getBrandRangeStatsAction(value);
      if (result.success && result.data) {
        setData(result.data);
      }
    });
  }

  const csvData = data.dailyData.map((d) => ({
    Data: formatDate(d.date),
    Kliknięcia: d.clicks,
    Konwersje: d.conversions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeFilter value={days} onChange={handleChange} />
        <ExportCSVButton data={csvData} filename="statystyki-marki" />
      </div>

      <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
        <Card>
          <CardHeader>
            <CardTitle>Kliknięcia i konwersje</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={data.dailyData}
              xKey="date"
              lines={[
                { dataKey: "clicks", name: "Kliknięcia", color: "#2563EB" },
                { dataKey: "conversions", name: "Konwersje", color: "#93C5FD" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Przychód per produkt</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={data.revenueByProduct} format="currency" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance per influencer</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={data.performanceByInfluencer} format="currency" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
