import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Download, FileText } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMyDocumentsAction } from "@/actions/document.actions";
import { getBankDetailsAction } from "@/actions/influencer.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function InfluencerDocumentsPage() {
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

  const [documentsResult, bankResult] = await Promise.all([
    getMyDocumentsAction(),
    getBankDetailsAction(),
  ]);

  const documents = documentsResult.success ? documentsResult.data ?? [] : [];
  const hasBankDetails = bankResult.success ? bankResult.data!.hasBankDetails : false;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Dokumenty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rachunki wystawiane automatycznie po zrealizowanych wypłatach prowizji.
        </p>
      </header>

      {!hasBankDetails && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            ⚠️ Uzupełnij dane rozliczeniowe, aby platforma mogła prawidłowo wystawiać
            dokumenty do Twoich wypłat.{" "}
            <Link href="/influencer/settings?tab=bank" className="font-semibold underline">
              Uzupełnij teraz →
            </Link>
          </span>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Historia dokumentów</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FileText}
                title="Brak dokumentów"
                description="Dokumenty pojawią się tutaj po zrealizowaniu pierwszej wypłaty prowizji."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Numer</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Okres</TableHead>
                  <TableHead className="text-right">Kwota netto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="pl-6 font-medium">{doc.number}</TableCell>
                    <TableCell className="text-muted-foreground">Rachunek</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.period)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-[#0F172A]">
                      {formatCurrency(doc.netAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {doc.status === "COMPLETED" ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/api/documents/${doc.id}/pdf`}>
                            <Download className="h-3.5 w-3.5" />
                            Pobierz PDF
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Dostępne po wypłacie
                        </span>
                      )}
                    </TableCell>
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
