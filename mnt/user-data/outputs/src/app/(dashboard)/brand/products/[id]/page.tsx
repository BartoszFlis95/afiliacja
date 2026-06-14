import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductForm } from "@/components/brand/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { MousePointerClick, TrendingUp, DollarSign } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!brandProfile) redirect("/brand/onboarding");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      affiliateLinks: {
        include: {
          influencerProfile: true,
          _count: { select: { clicks: true, conversions: true } },
        },
        orderBy: { totalEarnings: "desc" },
      },
    },
  });

  if (!product || product.brandProfileId !== brandProfile.id) {
    notFound();
  }

  const totalClicks = product.affiliateLinks.reduce((s, l) => s + l.totalClicks, 0);
  const totalConversions = product.affiliateLinks.reduce((s, l) => s + l.totalConversions, 0);
  const totalEarnings = product.affiliateLinks.reduce((s, l) => s + l.totalEarnings, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="text-muted-foreground mt-1">Szczegóły i statystyki produktu.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kliknięcia</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konwersje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wypłacone prowizje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      <ProductForm
        mode="edit"
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description ?? undefined,
          category: product.category,
          price: product.price ?? undefined,
          commissionRate: product.commissionRate,
          slug: product.slug,
          status: product.status,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Influencerzy promujący ten produkt</CardTitle>
        </CardHeader>
        <CardContent>
          {product.affiliateLinks.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Żaden influencer jeszcze nie promuje tego produktu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead className="text-right">Kliknięcia</TableHead>
                  <TableHead className="text-right">Konwersje</TableHead>
                  <TableHead className="text-right">Zarobki</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.affiliateLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.influencerProfile.displayName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{link.code}</TableCell>
                    <TableCell className="text-right">{link.totalClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{link.totalConversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(link.totalEarnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
