// src/app/(dashboard)/brand/products/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function BrandProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brandProfile: true,
      affiliateLinks: {
        include: { influencerProfile: true },
        orderBy: { totalEarnings: "desc" },
      },
    },
  });

  // Brak produktu lub produkt należy do innej marki → 404.
  if (!product || product.brandProfile.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/brand/products">← Wróć</Link>
        </Button>
        <Badge variant={statusVariant(product.status)}>{product.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.description && (
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail label="Kategoria" value={product.category ?? "—"} />
            <Detail label="Cena" value={formatCurrency(Number(product.price))} />
            <Detail
              label="Prowizja"
              value={`${formatCommission(product.commissionRate)}%`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Influencerzy promujący ten produkt</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead className="text-right">Kliknięcia</TableHead>
                <TableHead className="text-right">Konwersje</TableHead>
                <TableHead className="text-right">Zarobki</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.affiliateLinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nikt jeszcze nie promuje tego produktu.
                  </TableCell>
                </TableRow>
              ) : (
                product.affiliateLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.influencerProfile?.displayName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {link.totalClicks.toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="text-right">
                      {link.totalConversions.toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(link.totalEarnings))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
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
