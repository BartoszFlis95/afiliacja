import { redirect } from "next/navigation";
import { Check, Wallet, X } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInfluencerCommissionsAction } from "@/actions/commission.actions";
import { getBankDetailsAction } from "@/actions/influencer.actions";
import { PayoutModal } from "@/components/influencer/PayoutModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type CommissionsResult = Awaited<ReturnType<typeof getInfluencerCommissionsAction>>;
type CommissionRow = Extract<CommissionsResult, { success: true }>["data"][number];

const TABS = [
  { value: "ALL", label: "Wszystkie" },
  { value: "PENDING", label: "Oczekujące" },
  { value: "APPROVED", label: "Zatwierdzone" },
  { value: "PAID", label: "Wypłacone" },
  { value: "REJECTED", label: "Odrzucone" },
] as const;

const PAYOUT_STEPS = ["Zgłoszono", "W realizacji", "Zrealizowano"];

function payoutStepIndex(status: string): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "PROCESSING":
      return 1;
    case "COMPLETED":
      return 2;
    default:
      return -1;
  }
}

function PayoutStepper({ status }: { status: string }) {
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
        <X className="h-3.5 w-3.5" /> Odrzucona
      </span>
    );
  }

  const currentIndex = payoutStepIndex(status);

  return (
    <div className="flex items-center gap-1.5">
      {PAYOUT_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                i < currentIndex
                  ? "bg-emerald-600 text-white"
                  : i === currentIndex
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {i < currentIndex ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="text-[10px] text-slate-500">{step}</span>
          </div>
          {i < PAYOUT_STEPS.length - 1 && (
            <span
              className={cn(
                "h-0.5 w-6",
                i < currentIndex ? "bg-emerald-600" : "bg-slate-100"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CommissionsTable({ commissions, bankDetails }: {
  commissions: CommissionRow[];
  bankDetails?: Parameters<typeof PayoutModal>[0]["bankDetails"];
}) {
  if (commissions.length === 0) {
    return (
      <div className="p-6">
        <EmptyState icon={Wallet} title="Brak prowizji w tej kategorii" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">Produkt</TableHead>
          <TableHead>Marka</TableHead>
          <TableHead className="text-right">Wartość</TableHead>
          <TableHead className="text-right">Prowizja</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="pr-6 text-right">Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((commission) => (
          <TableRow key={commission.id}>
            <TableCell className="pl-6 font-medium">
              {commission.product?.name ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {commission.brand?.companyName ?? "—"}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(Number(commission.orderValue))}
            </TableCell>
            <TableCell className="text-right font-medium text-emerald-600">
              {formatCurrency(Number(commission.commissionAmount))}
            </TableCell>
            <TableCell>
              <StatusBadge status={commission.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(commission.createdAt)}
            </TableCell>
            <TableCell className="pr-6 text-right">
              {commission.status === "APPROVED" && !commission.payout ? (
                <PayoutModal
                  commissionId={commission.id}
                  amount={Number(commission.commissionAmount)}
                  bankDetails={bankDetails}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function InfluencerCommissionsPage() {
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

  const [result, bankResult, payouts] = await Promise.all([
    getInfluencerCommissionsAction(),
    getBankDetailsAction(),
    prisma.payout.findMany({
      where: { influencerId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const commissions: CommissionRow[] = result.success ? result.data ?? [] : [];
  const bankDetails = bankResult.success
    ? {
        hasBankDetails: bankResult.data!.hasBankDetails,
        preferredPayout: bankResult.data!.preferredPayout,
        bankAccountIban: bankResult.data!.bankAccountIban,
        paypalEmail: bankResult.data!.paypalEmail,
        minimumPayout: bankResult.data!.minimumPayout,
      }
    : undefined;

  const availableBalance = commissions
    .filter((c) => c.status === "APPROVED" && !c.payout)
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  const byStatus = (status: string) =>
    status === "ALL" ? commissions : commissions.filter((c) => c.status === status);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">Moje prowizje</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Śledź zarobki i zlecaj wypłaty zatwierdzonych prowizji.
        </p>
      </header>

      <Card className="max-w-xs">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo dostępne do wypłaty</p>
              <p className="text-2xl font-bold text-[#0F172A]">
                {formatCurrency(availableBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Suma zatwierdzonych prowizji</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="ALL">
        <TabsList className="flex h-auto flex-wrap gap-1 p-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({byStatus(tab.value).length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <Card className="overflow-hidden">
              <CommissionsTable commissions={byStatus(tab.value)} bankDetails={bankDetails} />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Historia wypłat</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <EmptyState icon={Wallet} title="Brak wniosków o wypłatę" />
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatCurrency(Number(payout.amount))}
                    </p>
                    <p className="text-xs text-slate-500">
                      Zgłoszono {formatDate(payout.requestedAt)}
                    </p>
                  </div>
                  <PayoutStepper status={payout.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
