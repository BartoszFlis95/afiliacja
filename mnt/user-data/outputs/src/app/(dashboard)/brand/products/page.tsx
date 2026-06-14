import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Eye } from "lucide-react";

const statusConfig = {
  ACTIVE:   { label: "Aktywny",    variant: "default"     as const },
  DRAFT:    { label: "Szkic",      variant: "secondary"   as const },
  INACTIVE: { label: "Nieaktywny", variant: "destructive" as const },
};

export default async function BrandProductsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) redirect("/brand/onboarding");

  const products = await prisma.product.findMany({
    where: { brandProfileId: brandProfile.id },
    include: { _count: { select: { affiliateLinks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produkty</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj swoimi produktami afiliacyjnymi.</p>
        </div>
        <Button asChild>
          <Link href="/brand/products/new">
            <Plus className="mr-2 h-4 w-4" />Dodaj produkt
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie produkty ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Nie masz jeszcze żadnych produktów. Dodaj pierwszy i zacznij zarabiać!
              </p>
              <Button asChild>
                <Link href="/brand/products/new">
                  <Plus className="mr-2 h-4 w-4" />Dodaj pierwszy produkt
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                  <TableHead className="text-right">Prowizja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Linki afiliac.</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const status = statusConfig[product.status];
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">
                        {product.price != null ? formatCurrency(product.price) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{product.commissionRate}%</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{product._count.affiliateLinks}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/brand/products/${product.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/products/${product.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
