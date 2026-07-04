import { z } from "zod";

export const ProductSchema = z
  .object({
    name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
    description: z.string().optional(),
    category: z.string().min(1, "Kategoria jest wymagana"),
    price: z.number().positive("Cena musi być dodatnia").optional(),
    commissionRate: z
      .number()
      .min(0.1, "Prowizja całkowita musi wynosić co najmniej 0.1%")
      .max(100, "Prowizja nie może przekraczać 100%"),
    influencerCommissionRate: z
      .number()
      .min(0, "Prowizja influencera nie może być ujemna")
      .max(100, "Prowizja nie może przekraczać 100%"),
    productUrl: z.string().url("Podaj prawidłowy URL produktu (np. https://sklep.pl/produkt)").or(z.literal("")),
    slug: z
      .string()
      .min(2, "Slug musi mieć co najmniej 2 znaki")
      .regex(/^[a-z0-9-]+$/, "Slug może zawierać tylko małe litery, cyfry i myślniki"),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]),
  })
  .refine(
    (data) => data.influencerCommissionRate <= data.commissionRate,
    {
      message: "Prowizja influencera nie może być większa od prowizji całkowitej",
      path: ["influencerCommissionRate"],
    }
  );

export type ProductFormData = z.infer<typeof ProductSchema>;
