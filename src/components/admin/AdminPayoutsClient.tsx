"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExportCSVButton } from "@/components/shared/ExportCSVButton";
import { PayoutActions } from "@/components/admin/PayoutActions";
import { StripeTransferButton } from "@/components/admin/StripeTransferButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate, maskIban } from "@/lib/utils";

export interface AdminPayoutRow {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  bankAccount: string | null;
  payoutMethod: string | null;
  requestedAt: string;
  processedAt: string | null;
  influencer: {
    displayName: string;
    avatarUrl: string | null;
    email: string;
    bankAccountIban: string | null;
    bankAccountBank: string | null;
    bankAccountName: string | null;
    bankSwift: string | null;
    paypalEmail: string | null;
    preferredPayout: string | null;
    stripeOnboardingDone: boolean;
  };
  commission: {
    productName: string;
    orderValue: number;
    commissionAmount: number;
  } | null;
}

const TABS = ["PENDING", "PROCESSING", "COMPLETED", "REJECTED"] as const;
const TAB_LABELS: Record<(typeof TABS)[number], string> = {
  PENDING: "Oczekujące",
  PROCESSING: "W realizacji",
  COMPLETED: "Zrealizowane",
  REJECTED: "Odrzucone",
};

function PayoutDetailsRow({ payout }: { payout: AdminPayoutRow }) {
  const [open, setOpen] = useState(false);
  const usesPaypal = payout.influencer.preferredPayout === "paypal";

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {open ? "Ukryj szczegóły" : "Pokaż dane bankowe i komisję"}
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Dane do wypłaty</p>
            {usesPaypal ? (
              <p className="text-slate-900">PayPal: {payout.influencer.paypalEmail ?? "—"}</p>
            ) : (
              <div className="space-y-0.5 text-slate-900">
                <p>{payout.influencer.bankAccountName ?? "—"}</p>
                <p className="font-mono text-xs">{payout.influencer.bankAccountIban ?? "—"}</p>
                <p className="text-xs text-slate-500">
                  {payout.influencer.bankAccountBank ?? "—"}
                  {payout.influencer.bankSwift ? ` · ${payout.influencer.bankSwift}` : ""}
                </p>
              </div>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Komisja</p>
            {payout.commission ? (
              <div className="text-slate-900">
                <p>{payout.commission.productName}</p>
                <p className="text-xs text-slate-500">
                  Zamówienie: {formatCurrency(payout.commission.orderValue)} · Prowizja:{" "}
                  {formatCurrency(payout.commission.commissionAmount)}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">—</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPayoutsClient({ payouts }: { payouts: AdminPayoutRow[] }) {
  function listFor(status: (typeof TABS)[number]) {
    return payouts.filter((p) => p.status === status);
  }

  return (
    <Tabs defaultValue="PENDING" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
        {TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm">
            {TAB_LABELS[tab]}
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              ({listFor(tab).length})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((tab) => {
        const list = listFor(tab);
        const sum = list.reduce((s, p) => s + p.amount, 0);
        const csvData = list.map((p) => ({
          Influencer: p.influencer.displayName,
          Email: p.influencer.email,
          Kwota: p.amount.toFixed(2),
          Metoda: p.influencer.preferredPayout === "paypal" ? "PayPal" : "Przelew bankowy",
          Status: p.status,
          "Data zgłoszenia": formatDate(p.requestedAt),
        }));

        return (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                Suma:{" "}
                <span className="font-semibold text-slate-900">{formatCurrency(sum)}</span> (
                {list.length} {list.length === 1 ? "wypłata" : "wypłat"})
              </p>
              <ExportCSVButton data={csvData} filename={`wyplaty-${tab.toLowerCase()}`} />
            </div>

            {list.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <EmptyState icon={Wallet} title="Brak wypłat w tej kategorii" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {list.map((payout) => (
                  <div key={payout.id}>
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                          {payout.influencer.avatarUrl ? (
                            <Image
                              src={payout.influencer.avatarUrl}
                              alt={payout.influencer.displayName}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                              {payout.influencer.displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {payout.influencer.displayName}
                          </p>
                          <p className="text-xs text-slate-500">{payout.influencer.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(payout.amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {payout.influencer.preferredPayout === "paypal"
                              ? "PayPal"
                              : `IBAN: ${maskIban(payout.influencer.bankAccountIban)}`}
                          </p>
                        </div>
                        <StatusBadge status={payout.status} />
                        <div className="flex flex-col items-end gap-1">
                          {tab === "PROCESSING" && (
                            <StripeTransferButton
                              payoutId={payout.id}
                              amount={payout.amount}
                              influencerName={payout.influencer.displayName}
                              stripeReady={payout.influencer.stripeOnboardingDone}
                            />
                          )}
                          <PayoutActions payoutId={payout.id} status={payout.status} />
                        </div>
                      </div>
                    </div>
                    <PayoutDetailsRow payout={payout} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
