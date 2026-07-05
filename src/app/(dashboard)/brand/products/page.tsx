import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageIcon } from "lucide-react";

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
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Produkty</h1>
          <p className="mt-1 text-muted-foreground">
            {products.length.toLocaleString("pl-PL")} produktów.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
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
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Zdjęcie</TableHead>
                <TableHead>Nazwa</TableHead>
                <TableHead className="hidden sm:table-cell">Kategoria</TableHead>
                <TableHead className="hidden md:table-cell text-right">Cena</TableHead>
                <TableHead className="text-right">Prowizja %</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Linki</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="py-2">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p className="line-clamp-1">{product.name}</p>
                      <p className="sm:hidden text-xs text-muted-foreground mt-0.5">
                        <Badge variant={statusVariant(product.status)} className="text-[10px] px-1 py-0">
                          {product.status}
                        </Badge>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {product.category ? (
                      <Badge variant="outline">{product.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {product.price ? formatCurrency(Number(product.price)) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCommission(product.commissionRate)}%
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={statusVariant(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
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
