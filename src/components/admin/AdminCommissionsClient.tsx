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
}: {
  commissions: CommissionRow[];
  brands: { id: string; companyName: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [brandFilter, setBrandFilter] = useState("ALL");
  const [influencerSearch, setInfluencerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = influencerSearch.trim().toLowerCase();
    return commissions.filter((c) => {
      if (brandFilter !== "ALL" && c.brandId !== brandFilter) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (q && !(c.influencer?.displayName ?? "").toLowerCase().includes(q)) return false;
      if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [commissions, brandFilter, statusFilter, influencerSearch, dateFrom, dateTo]);

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
    Data: formatDate(c.createdAt),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
                    <StatusBadge status={c.status} />
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
                          Zatwierdź
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
