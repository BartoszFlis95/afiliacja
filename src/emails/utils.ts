export { formatCurrency as formatEmailAmount } from "@/lib/utils";

export function formatEmailDate(date: Date | string): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function maskIban(iban?: string | null): string {
  if (!iban) return "—";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length < 6) return clean;
  return `${clean.slice(0, 2)}**...${clean.slice(-4)}`;
}
