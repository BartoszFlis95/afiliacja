"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  adminApproveCommissionAction,
  adminRejectCommissionAction,
  type getAllCommissionsAction,
} from "@/actions/commission.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { Button } from "@/components/ui/button";
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

type CommissionsResult = Awaited<ReturnType<typeof getAllCommissionsAction>>;
type CommissionRow = Extract<CommissionsResult, { success: true }>["data"][number];

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"] as const;

export function AdminCommissionsClient({
  commissions,
  brands,
  initialTab = "all",
}: {
  commissions: CommissionRow[];
  brands: { id: string; companyName: string }[];
  initialTab?: "all" | "suspicious";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [influencerSearch, setInfluencerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "suspicious">(initialTab);

  const suspiciousCount = useMemo(
    () => commissions.filter((c) => c.isSuspicious).length,
    [commissions]
  );

  const filtered = useMemo(() => {
    const q = influencerSearch.trim().toLowerCase();
    return commissions.filter((c) => {
      if (activeTab === "suspicious" && !c.isSuspicious) return false;
      if (suspiciousOnly && !c.isSuspicious) return false;
      if (brandFilter !== "ALL" && c.brandId !== brandFilter) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (q && !(c.influencer?.displayName ?? "").toLowerCase().includes(q)) return false;
      if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [commissions, activeTab, suspiciousOnly, brandFilter, statusFilter, influencerSearch, dateFrom, dateTo]);

  function handleAction(
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    id: string
  ) {
    startTransition(async () => {
      const result = await action(id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Błąd", description: result.error });
      } else {
        router.refresh();
      }
    });
  }

  const csvData = filtered.map((c) => ({
    Influencer: c.influencer?.displayName ?? "—",
    Marka: c.brand?.companyName ?? "—",
    Produkt: c.product?.name ?? "—",
    "Wartość zamówienia": Number(c.orderValue).toFixed(2),
    "Kwota prowizji": Number(c.commissionAmount).toFixed(2),
    Status: c.status,
    Podejrzane: c.isSuspicious ? "Tak" : "Nie",
    Powód: c.suspiciousReason ?? "",
    Data: formatDate(c.createdAt),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === "all"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Wszystkie
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("suspicious")}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === "suspicious"
              ? "border-b-2 border-amber-500 text-amber-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ⚠️ Podejrzane{suspiciousCount > 0 ? ` (${suspiciousCount})` : ""}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={suspiciousOnly}
            onChange={(e) => setSuspiciousOnly(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Pokaż tylko podejrzane
        </label>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Marka" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Wszystkie marki</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Szukaj influencera..."
          value={influencerSearch}
          onChange={(e) => setInfluencerSearch(e.target.value)}
          className="h-8 w-[180px] text-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "Wszystkie statusy" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-[140px] text-xs"
        />
        <span className="text-xs text-slate-400">—</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-[140px] text-xs"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length.toLocaleString("pl-PL")} komisji</p>
        <ExportCSVButton data={csvData} filename="komisje-platforma" />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Wallet} title="Brak komisji spełniających kryteria" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Marka</TableHead>
                <TableHead>Produkt</TableHead>
                <TableHead className="text-right">Wartość</TableHead>
                <TableHead className="text-right">Kwota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Powód</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.influencer?.displayName ?? "—"}</TableCell>
                  <TableCell className="text-slate-600">{c.brand?.companyName ?? "—"}</TableCell>
                  <TableCell className="text-slate-600">{c.product?.name ?? "—"}</TableCell>
                  <TableCell className="text-right text-slate-600">
                    {formatCurrency(Number(c.orderValue))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(c.commissionAmount))}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusBadge status={c.status} />
                      {c.isSuspicious && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          ⚠️ Podejrzane
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-slate-500">
                    {c.suspiciousReason ?? "—"}
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(c.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {c.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleAction(adminApproveCommissionAction, c.id)}
                        >
                          {c.isSuspicious ? "Zatwierdź mimo to" : "Zatwierdź"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleAction(adminRejectCommissionAction, c.id)}
                        >
                          Odrzuć
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
