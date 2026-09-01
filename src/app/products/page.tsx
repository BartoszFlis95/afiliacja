import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

// Publiczny katalog bez auth() — te same dane dla każdego, więc bezpiecznie
// cache'owalny (w przeciwieństwie do stron dashboardu, które renderują dane
// per-sesja i muszą zostać na force-dynamic).
export const revalidate = 60;

export default async function PublicProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; minCommission?: string }>;
}) {
  const { category, minCommission } = await searchParams;

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (category) {
    where.category = category;
  }
  const min = minCommission ? Number(minCommission) : NaN;
  if (!Number.isNaN(min)) {
    where.commissionRate = { gte: min };
  }

  const products = await prisma.product.findMany({
    where,
    include: { brandProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Deneeu
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Zaloguj się</Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="relative mb-8 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-8 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            Produkty
          </h1>
          <p className="mt-2 text-slate-500">
            Odkryj produkty dostępne w programie afiliacyjnym.
          </p>
        </header>

        <form
          method="get"
          className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Kategoria</Label>
            <Input
              id="category"
              name="category"
              defaultValue={category ?? ""}
              placeholder="np. Moda"
              className="h-9 w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="minCommission">Min. prowizja (%)</Label>
            <Input
              id="minCommission"
              name="minCommission"
              type="number"
              min={0}
              step="0.5"
              defaultValue={minCommission ?? ""}
              placeholder="np. 10"
              className="h-9 w-36"
            />
          </div>
          <Button type="submit" size="sm">
            Filtruj
          </Button>
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href="/products">Wyczyść</Link>
          </Button>
        </form>

        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed py-20 text-center text-muted-foreground">
            Brak produktów spełniających kryteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden rounded-2xl border-slate-100 shadow-sm transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-md">
                  {/* Miniaturka */}
                  <div className="relative w-full h-44 bg-slate-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-semibold leading-tight">
                        {product.name}
                      </h2>
                      <Badge variant="secondary" className="shrink-0">
                        {formatCommission(product.influencerCommissionRate)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.brandProfile?.companyName ?? "—"}
                    </p>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {formatCurrency(Number(product.price))}
                    </span>
                    <span className="text-sm text-primary group-hover:underline">
                      Szczegóły →
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatCommission(rate: number | { toString(): string }): string {
  return Number(rate).toFixed(1).replace(/\.0$/, "");
}
