"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";

import type { getFraudLogsAction } from "@/actions/admin.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type FraudLogRow = Awaited<ReturnType<typeof getFraudLogsAction>>[number];

const TYPE_OPTIONS = [
  "ALL",
  "SELF_CLICK",
  "IP_RATE_LIMIT",
  "SUSPICIOUS_CONVERSION",
  "COOLING_PERIOD",
] as const;

const TYPE_LABEL: Record<(typeof TYPE_OPTIONS)[number], string> = {
  ALL: "Wszystkie typy",
  SELF_CLICK: "Self-click",
  IP_RATE_LIMIT: "Limit IP",
  SUSPICIOUS_CONVERSION: "Podejrzana konwersja",
  COOLING_PERIOD: "Cooling period",
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  SELF_CLICK: "bg-destructive/15 text-destructive",
  IP_RATE_LIMIT: "bg-orange-100 dark:bg-orange-400/15 text-orange-800",
  SUSPICIOUS_CONVERSION: "bg-warning/15 text-warning",
  COOLING_PERIOD: "bg-muted text-foreground",
};

export function AdminFraudClient({ logs }: { logs: FraudLogRow[] }) {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (typeFilter !== "ALL" && log.type !== typeFilter) return false;
      if (dateFrom && new Date(log.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(log.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      if (q) {
        const haystack = [
          log.ip,
          log.reason,
          log.affiliateLink?.code,
          log.affiliateLink?.product?.name,
          log.affiliateLink?.influencerProfile?.displayName,
          log.commission?.brand?.companyName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, typeFilter, search, dateFrom, dateTo]);

  const csvData = filtered.map((log) => ({
    Typ: TYPE_LABEL[log.type as (typeof TYPE_OPTIONS)[number]] ?? log.type,
    Powód: log.reason,
    Link: log.affiliateLink?.code ?? "—",
    Produkt: log.affiliateLink?.product?.name ?? "—",
    Influencer: log.affiliateLink?.influencerProfile?.displayName ?? "—",
    IP: log.ip ?? "—",
    Data: formatDate(log.createdAt),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Szukaj (IP, link, influencer, marka)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[240px] text-xs"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-[140px] text-xs"
        />
        <span className="text-xs text-muted-foreground">—</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-[140px] text-xs"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length.toLocaleString("pl-PL")} zdarzeń</p>
        <ExportCSVButton data={csvData} filename="fraud-log" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={ShieldAlert} title="Brak zdarzeń spełniających kryteria" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Powód</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Influencer</TableHead>
                <TableHead>Marka</TableHead>
                <TableHead className="text-right">Wartość zam.</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_BADGE_CLASS[log.type] ?? "bg-muted text-foreground"
                      }`}
                    >
                      {TYPE_LABEL[log.type as (typeof TYPE_OPTIONS)[number]] ?? log.type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[260px] text-xs text-muted-foreground">{log.reason}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.affiliateLink?.code ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.affiliateLink?.influencerProfile?.displayName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.commission?.brand?.companyName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {log.commission ? formatCurrency(log.commission.orderValue) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.ip ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
