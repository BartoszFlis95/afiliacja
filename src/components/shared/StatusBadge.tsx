import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Obejmuje CommissionStatus, PayoutStatus, ConversionStatus i InvoiceStatus —
// te cztery enumy z Prisma współdzielą część wartości (PENDING, REJECTED, PAID),
// więc jedna mapa pokrywa statusy używane w całej aplikacji.
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:    { label: "Oczekuje",     className: "bg-amber-100 text-amber-800" },
  APPROVED:   { label: "Zatwierdzona", className: "bg-blue-100 text-blue-800" },
  CONFIRMED:  { label: "Potwierdzona", className: "bg-blue-100 text-blue-800" },
  PROCESSING: { label: "W realizacji", className: "bg-violet-100 text-violet-800" },
  PAID:       { label: "Wypłacona",    className: "bg-green-100 text-green-800" },
  COMPLETED:  { label: "Zrealizowana", className: "bg-green-100 text-green-800" },
  REJECTED:   { label: "Odrzucona",    className: "bg-red-100 text-red-800" },
  CANCELLED:  { label: "Anulowana",    className: "bg-red-100 text-red-800" },
  DRAFT:      { label: "Szkic",        className: "bg-slate-100 text-slate-600" },
  ISSUED:     { label: "Wystawiona",   className: "bg-blue-100 text-blue-800" },
  ACTIVE:     { label: "Aktywny",      className: "bg-green-100 text-green-800" },
  INACTIVE:   { label: "Nieaktywny",   className: "bg-red-100 text-red-800" },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <Badge className={cn(config.className, className)}>{label ?? config.label}</Badge>
  );
}
