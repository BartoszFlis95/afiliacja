import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageIcon, Package } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProductCardActions } from "@/components/brand/ProductCardActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type StatusFilter = "ALL" | "DRAFT" | "ACTIVE" | "INACTIVE";
type SortOption = "newest" | "revenue" | "clicks";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Wszystkie" },
  { value: "DRAFT", label: "Szkic" },
  { value: "ACTIVE", label: "Aktywne" },
  { value: "INACTIVE", label: "Nieaktywne" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "revenue", label: "Przychód" },
  { value: "clicks", label: "Kliknięcia" },
];

export default async function BrandProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brandProfile) {
    redirect("/brand/onboarding");
  }

  const params = await searchParams;
  const statusFilter: StatusFilter = (
    ["ALL", "DRAFT", "ACTIVE", "INACTIVE"] as string[]
  ).includes(params.status ?? "")
    ? (params.status as StatusFilter)
    : "ALL";
  const sort: SortOption = (["newest", "revenue", "clicks"] as string[]).includes(
    params.sort ?? ""
  )
    ? (params.sort as SortOption)
    : "newest";

  const [products, conversions] = await Promise.all([
    prisma.product.findMany({
      where: {
        brandProfileId: brandProfile.id,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      include: { affiliateLinks: { select: { totalClicks: true, totalConversions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversion.findMany({
      where: {
        affiliateLink: { product: { brandProfileId: brandProfile.id } },
        status: { in: ["CONFIRMED", "PAID"] },
      },
      select: { amount: true, affiliateLink: { select: { productId: true } } },
    }),
  ]);

  const revenueByProduct = new Map<string, number>();
  for (const c of conversions) {
    const pid = c.affiliateLink.productId;
    revenueByProduct.set(pid, (revenueByProduct.get(pid) ?? 0) + Number(c.amount));
  }

  const productRows = products
    .map((p) => ({
      ...p,
      clicks: p.affiliateLinks.reduce((s, l) => s + l.totalClicks, 0),
      conversions: p.affiliateLinks.reduce((s, l) => s + l.totalConversions, 0),
      revenue: revenueByProduct.get(p.id) ?? 0,
    }))
    .sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      if (sort === "clicks") return b.clicks - a.clicks;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Produkty</h1>
          <p className="mt-1 text-muted-foreground">
            {productRows.length.toLocaleString("pl-PL")} produktów.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/brand/products/new">Dodaj produkt</Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-3 text-xs font-medium hover:bg-slate-100",
                statusFilter === f.value &&
                  "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
              )}
            >
              <Link href={`/brand/products?status=${f.value}&sort=${sort}`}>{f.label}</Link>
            </Button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-3 text-xs font-medium hover:bg-slate-100",
                sort === opt.value &&
                  "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
              )}
            >
              <Link href={`/brand/products?status=${statusFilter}&sort=${opt.value}`}>
                {opt.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {productRows.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nie masz jeszcze żadnych produktów"
          description="Dodaj pierwszy produkt, aby influencerzy mogli zacząć go promować."
          action={
            <Button asChild size="sm">
              <Link href="/brand/products/new">Dodaj pierwszy produkt</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productRows.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-40 w-full bg-slate-100">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <StatusBadge status={product.status} />
                </div>
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="line-clamp-1 font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {product.price ? formatCurrency(Number(product.price)) : "Cena nieustawiona"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {product.clicks.toLocaleString("pl-PL")}
                    </p>
                    <p className="text-[11px] text-slate-500">Kliknięcia</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {product.conversions.toLocaleString("pl-PL")}
                    </p>
                    <p className="text-[11px] text-slate-500">Konwersje</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-[11px] text-slate-500">Przychód</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>
                    Komisja: <strong className="text-slate-900">{product.commissionRate}%</strong>
                  </span>
                  <span>
                    Influencer:{" "}
                    <strong className="text-slate-900">{product.influencerCommissionRate}%</strong>
                  </span>
                </div>

                <ProductCardActions productId={product.id} status={product.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
