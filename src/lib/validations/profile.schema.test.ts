import { describe, expect, it } from "vitest";

import {
  BrandProfileSchema,
  InfluencerProfileSchema,
} from "@/lib/validations/profile.schema";

/**
 * Ten schemat jest współdzielony przez formularz (klient) i akcję serwerową.
 * Testy pilnują, żeby przy kolejnej zmianie nie rozjechały się reguły —
 * wcześniej istniały trzy niezależne kopie i jedna z nich już się rozjechała.
 */
describe("BrandProfileSchema", () => {
  it("wymaga nazwy firmy o długości co najmniej 2 znaków", () => {
    expect(BrandProfileSchema.safeParse({ companyName: "A" }).success).toBe(false);
    expect(BrandProfileSchema.safeParse({ companyName: "AB" }).success).toBe(true);
  });

  it("traktuje puste pole website jako brak, a nie błąd", () => {
    // formularz wysyła "" dla pustego inputa — bez .or(z.literal("")) to byłby błąd
    expect(
      BrandProfileSchema.safeParse({ companyName: "Firma", website: "" }).success,
    ).toBe(true);
  });

  it("odrzuca website, który nie jest adresem URL", () => {
    expect(
      BrandProfileSchema.safeParse({ companyName: "Firma", website: "firma.pl" }).success,
    ).toBe(false);
  });

  it("komunikaty są po polsku", () => {
    const w = BrandProfileSchema.safeParse({ companyName: "" });
    expect(w.success).toBe(false);
    if (!w.success) expect(w.error.issues[0].message).toMatch(/[ąćęłńóśźż]/i);
  });
});

describe("InfluencerProfileSchema", () => {
  it("wymaga nazwy wyświetlanej", () => {
    expect(InfluencerProfileSchema.safeParse({ displayName: "" }).success).toBe(false);
    expect(InfluencerProfileSchema.safeParse({ displayName: "Kasia" }).success).toBe(true);
  });

  it("przycina białe znaki, więc same spacje to brak nazwy", () => {
    expect(InfluencerProfileSchema.safeParse({ displayName: "   " }).success).toBe(false);
  });

  it("odrzuca ujemną liczbę obserwujących", () => {
    expect(
      InfluencerProfileSchema.safeParse({ displayName: "Kasia", followersCount: -1 }).success,
    ).toBe(false);
  });

  it("odrzuca ułamkową liczbę obserwujących", () => {
    expect(
      InfluencerProfileSchema.safeParse({ displayName: "Kasia", followersCount: 10.5 }).success,
    ).toBe(false);
  });

  it("przyjmuje puste linki do social mediów", () => {
    expect(
      InfluencerProfileSchema.safeParse({
        displayName: "Kasia",
        instagramUrl: "",
        youtubeUrl: "",
        tiktokUrl: "",
      }).success,
    ).toBe(true);
  });
});
