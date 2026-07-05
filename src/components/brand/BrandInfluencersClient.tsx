"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Music2, Search, Users, Youtube } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type InfluencerRow = {
  influencerProfileId: string;
  displayName: string;
  avatarUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  productCount: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
};

type SortOption = "earnings" | "conversions";

export function BrandInfluencersClient({ rows }: { rows: InfluencerRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("earnings");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? rows.filter((r) => r.displayName.toLowerCase().includes(q)) : rows;
    return [...list].sort((a, b) =>
      sort === "earnings" ? b.totalEarnings - a.totalEarnings : b.totalConversions - a.totalConversions
    );
  }, [rows, search, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Szukaj influencera..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-slate-200 bg-white p-1">
          {(["earnings", "conversions"] as const).map((opt) => (
            <Button
              key={opt}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSort(opt)}
              className={cn(
                "h-7 px-3 text-xs font-medium hover:bg-slate-100",
                sort === opt && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
              )}
            >
              {opt === "earnings" ? "Przychód" : "Konwersje"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Brak wyników"
          description={
            search
              ? "Spróbuj innej frazy wyszukiwania."
              : "Żaden influencer nie promuje jeszcze Twoich produktów."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Social media</TableHead>
                <TableHead className="text-right">Aktywne linki</TableHead>
                <TableHead className="text-right">Kliknięcia</TableHead>
                <TableHead className="text-right">Konwersje</TableHead>
                <TableHead className="text-right">Przychód</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.influencerProfileId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {row.avatarUrl ? (
                          <Image
                            src={row.avatarUrl}
                            alt={row.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                            {row.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-medium">{row.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-400">
                      {row.instagramUrl && (
                        <Link href={row.instagramUrl} target="_blank">
                          <Instagram className="h-4 w-4 hover:text-slate-900" />
                        </Link>
                      )}
                      {row.youtubeUrl && (
                        <Link href={row.youtubeUrl} target="_blank">
                          <Youtube className="h-4 w-4 hover:text-slate-900" />
                        </Link>
                      )}
                      {row.tiktokUrl && (
                        <Link href={row.tiktokUrl} target="_blank">
                          <Music2 className="h-4 w-4 hover:text-slate-900" />
                        </Link>
                      )}
                      {!row.instagramUrl && !row.youtubeUrl && !row.tiktokUrl && (
                        <span className="text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.productCount.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalClicks.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalConversions.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {formatCurrency(row.totalEarnings)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
