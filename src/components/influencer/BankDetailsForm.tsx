"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { updateBankDetailsAction, type BankDetailsData } from "@/actions/influencer.actions";
import { BankDetailsSchema } from "@/lib/validations/bank.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatIbanDisplay(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

interface Props {
  initial: BankDetailsData;
}

export function BankDetailsForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"bank" | "paypal">(
    (initial.preferredPayout as "bank" | "paypal") ?? "bank"
  );

  const [bankAccountName, setBankAccountName] = useState(initial.bankAccountName ?? "");
  const [bankAccountIban, setBankAccountIban] = useState(
    initial.bankAccountIban ? formatIbanDisplay(initial.bankAccountIban) : ""
  );
  const [bankAccountBank, setBankAccountBank] = useState(initial.bankAccountBank ?? "");
  const [bankSwift, setBankSwift] = useState(initial.bankSwift ?? "");
  const [paypalEmail, setPaypalEmail] = useState(initial.paypalEmail ?? "");
  const [minimumPayout, setMinimumPayout] = useState(initial.minimumPayout ?? 100);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [country, setCountry] = useState(initial.country ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleIbanChange(val: string) {
    const formatted = formatIbanDisplay(val);
    setBankAccountIban(formatted);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload =
      mode === "bank"
        ? {
            preferredPayout: "bank" as const,
            bankAccountName,
            bankAccountIban: bankAccountIban.replace(/\s/g, ""),
            bankAccountBank,
            bankSwift: bankSwift || undefined,
            minimumPayout,
            phone: phone || undefined,
            city: city || undefined,
            country: country || undefined,
          }
        : {
            preferredPayout: "paypal" as const,
            paypalEmail,
            minimumPayout,
            phone: phone || undefined,
            city: city || undefined,
            country: country || undefined,
          };

    const parsed = BankDetailsSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const result = await updateBankDetailsAction(payload);
      if (result.success) {
        toast({ title: "Dane bankowe zapisane." });
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  }

  const hasBankDetails =
    (mode === "bank" && !!initial.bankAccountIban && initial.preferredPayout === "bank") ||
    (mode === "paypal" && !!initial.paypalEmail && initial.preferredPayout === "paypal");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">Dane do wypłat</CardTitle>
        <Badge variant={hasBankDetails ? "success" : "destructive"}>
          {hasBankDetails ? "Skonfigurowane" : "Wymagana konfiguracja"}
        </Badge>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {(["bank", "paypal"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {m === "bank" ? "Przelew bankowy" : "PayPal"}
              </button>
            ))}
          </div>

          {mode === "bank" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Właściciel konta</Label>
                <Input
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Jan Kowalski"
                  disabled={isPending}
                />
                {errors.bankAccountName && (
                  <p className="text-xs text-destructive">{errors.bankAccountName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>IBAN</Label>
                <Input
                  value={bankAccountIban}
                  onChange={(e) => handleIbanChange(e.target.value)}
                  placeholder="PL12 3456 7890 1234 5678 9012 3456"
                  disabled={isPending}
                  className="font-mono"
                />
                {errors.bankAccountIban && (
                  <p className="text-xs text-destructive">{errors.bankAccountIban}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nazwa banku</Label>
                  <Input
                    value={bankAccountBank}
                    onChange={(e) => setBankAccountBank(e.target.value)}
                    placeholder="PKO Bank Polski"
                    disabled={isPending}
                  />
                  {errors.bankAccountBank && (
                    <p className="text-xs text-destructive">{errors.bankAccountBank}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>SWIFT / BIC (opcjonalnie)</Label>
                  <Input
                    value={bankSwift}
                    onChange={(e) => setBankSwift(e.target.value.toUpperCase())}
                    placeholder="PKOPPLPW"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Email PayPal</Label>
              <Input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="twoj@paypal.com"
                disabled={isPending}
              />
              {errors.paypalEmail && (
                <p className="text-xs text-destructive">{errors.paypalEmail}</p>
              )}
            </div>
          )}

          {/* Minimum payout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Minimalna kwota wypłaty</Label>
              <span className="text-sm font-semibold text-zinc-900">
                {minimumPayout} zł
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={50}
              value={minimumPayout}
              onChange={(e) => setMinimumPayout(Number(e.target.value))}
              disabled={isPending}
              className="w-full accent-zinc-900"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50 zł</span>
              <span>500 zł</span>
            </div>
          </div>

          {/* Optional personal details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+48 600 000 000"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Miasto</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Warszawa"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kraj</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Polska"
                disabled={isPending}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-zinc-900 text-white hover:bg-zinc-700"
          >
            {isPending ? "Zapisywanie…" : "Zapisz dane bankowe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
