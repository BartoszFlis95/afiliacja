import { z } from "zod";

/**
 * Jedno źródło prawdy dla walidacji profili marki i influencera.
 *
 * Wcześniej ten plik był martwy — nikt go nie importował — a te same reguły
 * żyły w trzech kopiach: w akcji serwerowej, w formularzu klienta i tutaj.
 * Kopie były identyczne co do znaku, ale ta w tym pliku zdążyła się już
 * rozjechać (min(1) zamiast min(2), komunikaty po angielsku), co pokazuje,
 * jak to się kończy: zmiana reguły w jednym miejscu, dwa pozostałe zostają.
 *
 * Klient i serwer walidują teraz DOKŁADNIE tym samym schematem, więc
 * formularz nie może przepuścić czegoś, co akcja odrzuci.
 */

const URL_MSG = "Nieprawidłowy URL";

/** Pole URL opcjonalne — puste pole w formularzu to "", nie undefined. */
const optionalUrl = z.string().trim().url(URL_MSG).optional().or(z.literal(""));

export const BrandProfileSchema = z.object({
  companyName: z.string().min(2, "Nazwa firmy musi mieć co najmniej 2 znaki"),
  industry: z.string().optional(),
  website: optionalUrl,
  description: z.string().optional(),
});

export const InfluencerProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Nazwa wyświetlana jest wymagana"),
  bio: z.string().trim().optional().or(z.literal("")),
  website: optionalUrl,
  instagramUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  followersCount: z.coerce
    .number()
    .int("Liczba obserwujących musi być liczbą całkowitą")
    .min(0, "Liczba obserwujących nie może być ujemna")
    .optional(),
});

export type BrandProfileSchemaType = z.infer<typeof BrandProfileSchema>;
export type InfluencerProfileSchemaType = z.infer<typeof InfluencerProfileSchema>;
