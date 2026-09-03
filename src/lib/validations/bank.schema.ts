import { z } from "zod";
import { poprawnyIban } from "@/lib/iban";

const commonFields = {
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
};

export const BankDetailsSchema = z.discriminatedUnion("preferredPayout", [
  z.object({
    preferredPayout: z.literal("bank"),
    bankAccountName: z.string().min(3, "Podaj imię i nazwisko właściciela konta"),
    bankAccountIban: z
      .string()
      .min(15, "Nieprawidłowy IBAN")
      .refine(poprawnyIban, "Nieprawidłowy format IBAN (np. PL12345678901234567890123456)"),
    bankAccountBank: z.string().min(2, "Podaj nazwę banku"),
    bankSwift: z.string().optional(),
    ...commonFields,
  }),
  z.object({
    preferredPayout: z.literal("paypal"),
    paypalEmail: z.string().email("Nieprawidłowy email PayPal"),
    ...commonFields,
  }),
]);

export type BankDetailsFormData = z.infer<typeof BankDetailsSchema>;
