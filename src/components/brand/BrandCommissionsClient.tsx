"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  approveCommissionAction,
  rejectCommissionAction,
  type getBrandCommissionsAction,
} from "@/actions/commission.actions";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type CommissionsResult = Awaited<ReturnType<typeof getBrandCommissionsAction>>;
type CommissionRow = Extract<CommissionsResult, { success: true }>["data"][number];

const TABS = ["PENDING", "APPROVED", "REJECTED", "PAID"] as const;
const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  PENDING: "Oczekujące",
  APPROVED: "Zatwierdzone",
  REJECTED: "Odrzucone",
  PAID: "Wypłacone",
};

export function BrandCommissionsClient({
  commissions,
  products,
}: {
  commissions: CommissionRow[];
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [productFilter, setProductFilter] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function filterList(status: (typeof TABS)[number]) {
    return commissions.filter((c) => {
      if (c.status !== status) return false;
      if (productFilter !== "ALL" && c.productId !== productFilter) return false;
      if (dateFrom && new Date(c.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.createdAt) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  }

  function handleBulkApprove(ids: string[]) {
    startTransition(async () => {
      const results = await Promise.all(ids.map((id) => approveCommissionAction(id)));
      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) {
        toast({
          variant: "destructive",
          title: "Część zatwierdzeń nie powiodła się",
          description: `${failed} z ${ids.length} nie zostało zatwierdzonych.`,
        });
      } else {
        toast({ title: "Zatwierdzono", description: `${ids.length} prowizji zatwierdzonych.` });
      }
      setSelected(new Set());
      router.refresh();
    });
  }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Produkt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Wszystkie produkty</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
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

      <Tabs defaultValue="PENDING" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm">
              {TAB_LABELS[tab]}
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({filterList(tab).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => {
          const list = filterList(tab);
          const csvData = list.map((c) => ({
            Influencer: c.influencer?.displayName ?? "—",
            Produkt: c.product?.name ?? "—",
            "Wartość zamówienia": Number(c.orderValue).toFixed(2),
            "Kwota prowizji": Number(c.commissionAmount).toFixed(2),
            Status: c.status,
            Data: formatDate(c.createdAt),
          }));

          return (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                {tab === "PENDING" && selected.size > 0 ? (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleBulkApprove(Array.from(selected))}
                  >
                    Zatwierdź zaznaczone ({selected.size})
                  </Button>
                ) : (
                  <span />
                )}
                <ExportCSVButton data={csvData} filename={`komisje-${tab.toLowerCase()}`} />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {list.length === 0 ? (
                  <div className="p-6">
                    <EmptyState icon={Wallet} title="Brak komisji w tej kategorii" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tab === "PENDING" && (
                          <TableHead className="w-10">
                            <Checkbox
                              checked={list.length > 0 && list.every((c) => selected.has(c.id))}
                              onCheckedChange={() => toggleSelectAll(list.map((c) => c.id))}
                            />
                          </TableHead>
                        )}
                        <TableHead>Influencer</TableHead>
                        <TableHead>Produkt</TableHead>
                        <TableHead className="text-right">Wartość zamówienia</TableHead>
                        <TableHead className="text-right">Prowizja %</TableHead>
                        <TableHead className="text-right">Kwota prowizji</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        {tab === "PENDING" && <TableHead className="text-right">Akcje</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((c) => (
                        <TableRow key={c.id}>
                          {tab === "PENDING" && (
                            <TableCell>
                              <Checkbox
                                checked={selected.has(c.id)}
                                onCheckedChange={() => toggleSelect(c.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-slate-900">
                            {c.influencer?.displayName ?? "—"}
                          </TableCell>
                          <TableCell className="text-slate-700">
                            {c.product?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-slate-700">
                            {formatCurrency(Number(c.orderValue))}
                          </TableCell>
                          <TableCell className="text-right text-slate-700">
                            {Number(c.commissionPercent)}%
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            {formatCurrency(Number(c.commissionAmount))}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {formatDate(c.createdAt)}
                          </TableCell>
                          {tab === "PENDING" && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleAction(approveCommissionAction, c.id)}
                                >
                                  Zatwierdź
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isPending}
                                  onClick={() => handleAction(rejectCommissionAction, c.id)}
                                >
                                  Odrzuć
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
