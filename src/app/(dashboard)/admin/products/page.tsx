import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleProductButton } from "@/components/admin/ToggleProductButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const products = await prisma.product.findMany({
    include: {
      brandProfile: true,
      _count: { select: { affiliateLinks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Produkty</h1>
        <p className="mt-1 text-muted-foreground">
          {products.length.toLocaleString("pl-PL")} produktów w systemie.
        </p>
      </header>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead className="text-right">Prowizja %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Linki</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Brak produktów.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.brandProfile?.companyName ?? "—"}
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
                    <ToggleProductButton productId={product.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
