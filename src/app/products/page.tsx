// src/app/products/page.tsx
import Link from "next/link";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

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
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Produkty</h1>
          <p className="mt-2 text-muted-foreground">
            Odkryj produkty dostępne w programie afiliacyjnym.
          </p>
        </header>

        <form
          method="get"
          className="mb-8 flex flex-wrap items-end gap-4 rounded-lg border p-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium">
              Kategoria
            </label>
            <input
              id="category"
              name="category"
              defaultValue={category ?? ""}
              placeholder="np. Moda"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="minCommission" className="text-sm font-medium">
              Min. prowizja (%)
            </label>
            <input
              id="minCommission"
              name="minCommission"
              type="number"
              min={0}
              step="0.5"
              defaultValue={minCommission ?? ""}
              placeholder="np. 10"
              className="h-9 w-36 rounded-md border bg-background px-3 text-sm"
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
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-semibold leading-tight">
                        {product.name}
                      </h2>
                      <Badge variant="secondary" className="shrink-0">
                        {formatCommission(product.commissionRate)}%
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
