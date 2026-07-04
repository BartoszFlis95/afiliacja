import { z } from "zod";

export const GenerateInvoiceSchema = z
  .object({
    brandId: z.string().min(1, "Wybierz markę"),
    periodFrom: z.string().min(1, "Podaj datę od"),
    periodTo: z.string().min(1, "Podaj datę do"),
    vatRate: z.number().min(0).max(100).default(23),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.periodFrom) <= new Date(data.periodTo), {
    message: "Data od musi być przed datą do",
    path: ["periodTo"],
  });

export type GenerateInvoiceFormData = z.infer<typeof GenerateInvoiceSchema>;
