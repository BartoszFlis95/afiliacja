import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(Number(amount));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function maskIban(iban?: string | null): string {
  if (!iban) return "—";
  const clean = iban.replace(/\s+/g, "");
  // zamykamy się, nie otwieramy: funkcja od maskowania nie może przy
  // nietypowym wejściu zwrócić wartości w całości
  if (clean.length < 6) return "****";
  return `${clean.slice(0, 2)}**...${clean.slice(-4)}`;
}