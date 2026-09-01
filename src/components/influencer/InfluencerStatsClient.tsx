"use client";

import { useState, useTransition } from "react";
import { BarChart3 } from "lucide-react";

import { getInfluencerRangeStatsAction, type InfluencerRangeStats } from "@/actions/influencer.actions";
import { DateRangeFilter, type DateRangeDays } from "@/components/shared/DateRangeFilter";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export function InfluencerStatsClient({
  initialData,
}: {
  initialData: InfluencerRangeStats;
}) {
  const [days, setDays] = useState<DateRangeDays>(30);
  const [data, setData] = useState<InfluencerRangeStats>(initialData);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: DateRangeDays) {
    setDays(value);
    startTransition(async () => {
      const result = await getInfluencerRangeStatsAction(value);
      if (result.success && result.data) {
        setData(result.data);
      }
    });
  }

  const csvData = data.links.map((l) => ({
    Produkt: l.productName,
    Kliknięcia: l.clicks,
    Konwersje: l.conversions,
    "CR%": l.conversionRate.toFixed(2),
    Zarobki: l.earnings.toFixed(2),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeFilter value={days} onChange={handleChange} />
        <ExportCSVButton data={csvData} filename="statystyki-influencer" />
      </div>

      <div className={isPending ? "opacity-60 transition-opacity" : undefined}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Kliknięcia w czasie</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart
                data={data.dailyClicks}
                xKey="date"
                lines={[{ dataKey: "clicks", name: "Kliknięcia", color: "#2563EB" }]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zarobki per produkt</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={data.earningsByProduct} format="currency" />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Statystyki per link</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.links.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={BarChart3} title="Brak danych w wybranym okresie" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Produkt</TableHead>
                    <TableHead className="text-right">Kliknięcia</TableHead>
                    <TableHead className="text-right">Konwersje</TableHead>
                    <TableHead className="text-right">CR%</TableHead>
                    <TableHead className="pr-6 text-right">Zarobki</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="pl-6 font-medium">{link.productName}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {link.clicks.toLocaleString("pl-PL")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {link.conversions.toLocaleString("pl-PL")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {link.conversionRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium text-success">
                        {formatCurrency(link.earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
