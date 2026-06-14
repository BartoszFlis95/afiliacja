import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyLinkButton } from "@/components/influencer/CopyLinkButton";

export const dynamic = "force-dynamic";

export default async function InfluencerLinksPage() {
  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/influencer/onboarding");
  }

  const links = await prisma.affiliateLink.findMany({
    where: { influencerProfileId: profile.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Moje linki</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {links.length.toLocaleString("pl-PL")} linków afiliacyjnych.
        </p>
      </header>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle>Wszystkie linki</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-t hover:bg-transparent">
                <TableHead className="pl-6">Produkt</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead className="text-right">Kliknięcia</TableHead>
                <TableHead className="text-right">Konwersje</TableHead>
                <TableHead className="text-right">Zarobki</TableHead>
                <TableHead className="pr-6 text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nie masz jeszcze żadnych linków. Przejdź do{" "}
                    <span className="font-medium text-primary">Produkty</span>{" "}
                    i wygeneruj swój pierwszy link.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="pl-6 font-medium">
                      {link.product?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5 w-fit">
                      {link.code}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {link.totalClicks.toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {link.totalConversions.toLocaleString("pl-PL")}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(Number(link.totalEarnings))}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <CopyLinkButton code={link.code} />
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
