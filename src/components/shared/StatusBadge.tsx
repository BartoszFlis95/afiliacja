import { cn } from "@/lib/utils";

// Obejmuje CommissionStatus, PayoutStatus, ConversionStatus i InvoiceStatus —
// te cztery enumy z Prisma współdzielą część wartości (PENDING, REJECTED, PAID),
// więc jedna mapa pokrywa statusy używane w całej aplikacji. Kolory statusów
// zostają semantyczne (amber/zielony/czerwony/zinc) mimo przejścia reszty UI
// na zinc — to uniwersalna konwencja UX, nie element brandingu.
//
// Mapowanie 1:1 z wymaganą specyfikacją:
// ACTIVE/APPROVED/PAID → green, PENDING → amber, REJECTED/INACTIVE → red, DRAFT → zinc.
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING:    { label: "Oczekuje",     bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-100",  dot: "bg-amber-500" },
  APPROVED:   { label: "Zatwierdzona", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100",  dot: "bg-green-500" },
  CONFIRMED:  { label: "Potwierdzona", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100",  dot: "bg-green-500" },
  PROCESSING: { label: "W realizacji", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", dot: "bg-violet-500" },
  PAID:       { label: "Wypłacona",    bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100",  dot: "bg-green-500" },
  COMPLETED:  { label: "Zrealizowana", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100",  dot: "bg-green-500" },
  REJECTED:   { label: "Odrzucona",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-100",    dot: "bg-red-500" },
  CANCELLED:  { label: "Anulowana",    bg: "bg-red-50",    text: "text-red-700",    border: "border-red-100",    dot: "bg-red-500" },
  DRAFT:      { label: "Szkic",        bg: "bg-zinc-50",   text: "text-zinc-600",   border: "border-zinc-100",   dot: "bg-zinc-400" },
  ISSUED:     { label: "Wystawiona",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100",   dot: "bg-blue-500" },
  ACTIVE:     { label: "Aktywny",      bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100",  dot: "bg-green-500" },
  INACTIVE:   { label: "Nieaktywny",   bg: "bg-red-50",    text: "text-red-700",    border: "border-red-100",    dot: "bg-red-500" },
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
    bg: "bg-zinc-50",
    text: "text-zinc-600",
    border: "border-zinc-100",
    dot: "bg-zinc-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {label ?? config.label}
    </span>
  );
}
