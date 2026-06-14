// src/app/(dashboard)/brand/products/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function BrandProductsPage() {
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

  const products = await prisma.product.findMany({
    where: { brandProfileId: brandProfile.id },
    include: { _count: { select: { affiliateLinks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produkty</h1>
          <p className="mt-1 text-muted-foreground">
            {products.length.toLocaleString("pl-PL")} produktów.
          </p>
        </div>
        <Button asChild>
          <Link href="/brand/products/new">Dodaj produkt</Link>
        </Button>
      </header>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed py-20 text-center">
          <p className="text-muted-foreground">
            Nie masz jeszcze żadnych produktów.
          </p>
          <Button asChild className="mt-4">
            <Link href="/brand/products/new">Dodaj pierwszy produkt</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead className="text-right">Prowizja %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Linki</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(product.price))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCommission(product.commissionRate)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {product._count.affiliateLinks.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/brand/products/${product.id}`}>Edytuj</Link>
                    </Button>
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

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "destructive";
    case "DRAFT":
    default:
      return "secondary";
  }
}

function formatCommission(rate: number | { toString(): string }): string {
  return Number(rate).toFixed(1).replace(/\.0$/, "");
}
