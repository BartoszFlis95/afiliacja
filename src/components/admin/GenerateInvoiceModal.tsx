"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { generateInvoiceAction, previewInvoiceAction } from "@/actions/invoice.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, ChevronLeft } from "lucide-react";
import type { InvoiceItem } from "@/types";

const formatPLN = (v: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);

interface Brand {
  id: string;
  companyName: string;
}

interface PreviewData {
  items: InvoiceItem[];
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  brandCompanyName: string;
}

interface Props {
  brands: Brand[];
}

const QUICK_MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export function GenerateInvoiceModal({ brands }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [isPending, startTransition] = useTransition();

  const [brandId, setBrandId] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [vatRate, setVatRate] = useState("23");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function selectMonth(monthIndex: number) {
    const now = new Date();
    const year = now.getFullYear();
    const month = monthIndex + 1;
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    setPeriodFrom(from);
    setPeriodTo(to);
  }

  function handlePreview() {
    setFormError(null);
    if (!brandId) { setFormError("Wybierz markę."); return; }
    if (!periodFrom || !periodTo) { setFormError("Podaj okres rozliczeniowy."); return; }
    if (new Date(periodFrom) > new Date(periodTo)) {
      setFormError("Data od musi być przed datą do.");
      return;
    }

    startTransition(async () => {
      const result = await previewInvoiceAction({
        brandId,
        periodFrom,
        periodTo,
        vatRate: Number(vatRate),
      });

      if (result.success) {
        setPreview(result.data!);
        setStep("preview");
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await generateInvoiceAction({
        brandId,
        periodFrom,
        periodTo,
        vatRate: Number(vatRate),
        notes: notes || undefined,
      });

      if (result.success) {
        toast({ title: `Faktura ${result.data!.invoiceNumber} wystawiona.` });
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      }
    });
  }

  function resetForm() {
    setBrandId("");
    setPeriodFrom("");
    setPeriodTo("");
    setVatRate("23");
    setNotes("");
    setPreview(null);
    setStep("form");
    setFormError(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white hover:bg-slate-700">
          <Plus className="mr-2 h-4 w-4" />
          Wystaw fakturę
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {step === "form" ? "Wystaw fakturę" : "Podgląd faktury"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4 pt-2">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Marka</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz markę…" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Szybki wybór miesiąca</Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MONTHS.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectMonth(i)}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Od</Label>
                <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Do</Label>
                <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Stawka VAT</Label>
                <Select value={vatRate} onValueChange={setVatRate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="23">23%</SelectItem>
                    <SelectItem value="8">8%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Uwagi (opcjonalnie)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dodatkowe informacje do faktury…"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
              <Button
                onClick={handlePreview}
                disabled={isPending}
                className="bg-slate-900 text-white hover:bg-slate-700"
              >
                {isPending ? "Obliczanie…" : "Podgląd faktury →"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {preview && (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-1">
                  <p className="font-medium text-slate-900">{preview.brandCompanyName}</p>
                  <p className="text-muted-foreground text-xs">
                    {periodFrom} – {periodTo}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pozycje
                  </p>
                  {preview.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} szt. × {formatPLN(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPLN(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Netto</span>
                    <span>{formatPLN(preview.netAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT {vatRate}%</span>
                    <span>{formatPLN(preview.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 text-base">
                    <span>Brutto</span>
                    <span>{formatPLN(preview.grossAmount)}</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("form")}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Wróć
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-slate-900 text-white hover:bg-slate-700"
              >
                {isPending ? "Wystawianie…" : "Wystaw fakturę"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
