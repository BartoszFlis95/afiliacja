import { ProductCategory } from "@prisma/client";

/**
 * Kategorie produktów.
 *
 * Nazwy wartości są ASCII, bo Prisma nie przyjmuje polskich znaków w nazwach
 * wartości enuma — diakrytyki żyją wyłącznie w etykietach, czyli tam, gdzie
 * widzi je użytkownik. Zgodność kluczy tej mapy z enumem pilnuje test
 * w categories.test.ts.
 */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ELEKTRONIKA:          "Elektronika",
  KOMPUTERY:            "Komputery i laptopy",
  TELEFONY:             "Telefony i akcesoria",
  AGD:                  "AGD — sprzęt domowy",
  RTV:                  "RTV — audio i video",
  MODA_DAMSKA:          "Moda damska",
  MODA_MESKA:           "Moda męska",
  MODA_DZIECIECA:       "Moda dziecięca",
  OBUWIE:               "Obuwie",
  TOREBKI:              "Torebki i bagaże",
  BIZUTERIA:            "Biżuteria",
  ZEGARKI:              "Zegarki",
  URODA:                "Uroda i kosmetyki",
  PERFUMY:              "Perfumy i zapachy",
  PIELEGNACJA:          "Pielęgnacja ciała",
  ZDROWIE:              "Zdrowie i apteka",
  SUPLEMENTY:           "Suplementy diety",
  SPORT:                "Sport i rekreacja",
  FITNESS:              "Fitness i siłownia",
  OUTDOOR:              "Outdoor i camping",
  ROWERY:               "Rowery i hulajnogi",
  DOM:                  "Dom i wnętrza",
  OGROD:                "Ogród i balkon",
  MEBLE:                "Meble",
  DEKORACJE:            "Dekoracje i ozdoby",
  KUCHNIA:              "Kuchnia i gotowanie",
  LAZIENKA:             "Łazienka",
  POSCIEL:              "Pościel i poduszki",
  ZABAWKI:              "Zabawki dla dzieci",
  GRY_PLANSZOWE:        "Gry planszowe",
  KSIAZKI:              "Książki",
  MUZYKA:               "Muzyka i płyty",
  FILMY:                "Filmy i seriale",
  GAMING:               "Gaming i konsole",
  OPROGRAMOWANIE:       "Oprogramowanie",
  JEDZENIE:             "Jedzenie i przekąski",
  NAPOJE:               "Napoje",
  ALKOHOL:              "Alkohole i wina",
  SUCHE_PRODUKTY:       "Suche produkty spożywcze",
  ZWIERZETA:            "Zwierzęta domowe",
  MOTORYZACJA:          "Motoryzacja",
  CZESCI_SAMOCHODOWE:   "Części samochodowe",
  AKCESORIA_AUTO:       "Akcesoria samochodowe",
  BIURO:                "Biuro i papiernictwo",
  SZKOLA:               "Szkoła i nauka",
  BUDOWNICTWO:          "Budowa i remont",
  NARZEDZIA:            "Narzędzia",
  FOTOGRAFIA:           "Fotografia i film",
  MUZYCZNE_INSTRUMENTY: "Instrumenty muzyczne",
  PODROZE:              "Podróże i turystyka",
  INNE:                 "Inne",
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  ELEKTRONIKA:          "🔌",
  KOMPUTERY:            "💻",
  TELEFONY:             "📱",
  AGD:                  "🍳",
  RTV:                  "📺",
  MODA_DAMSKA:          "👗",
  MODA_MESKA:           "👔",
  MODA_DZIECIECA:       "🧒",
  OBUWIE:               "👟",
  TOREBKI:              "👜",
  BIZUTERIA:            "💍",
  ZEGARKI:              "⌚",
  URODA:                "💄",
  PERFUMY:              "🌸",
  PIELEGNACJA:          "🧴",
  ZDROWIE:              "💊",
  SUPLEMENTY:           "💪",
  SPORT:                "⚽",
  FITNESS:              "🏋️",
  OUTDOOR:              "⛺",
  ROWERY:               "🚴",
  DOM:                  "🏠",
  OGROD:                "🌿",
  MEBLE:                "🛋️",
  DEKORACJE:            "🕯️",
  KUCHNIA:              "🍽️",
  LAZIENKA:             "🚿",
  POSCIEL:              "🛏️",
  ZABAWKI:              "🧸",
  GRY_PLANSZOWE:        "🎲",
  KSIAZKI:              "📚",
  MUZYKA:               "🎵",
  FILMY:                "🎬",
  GAMING:               "🎮",
  OPROGRAMOWANIE:       "💿",
  JEDZENIE:             "🍕",
  NAPOJE:               "🥤",
  ALKOHOL:              "🍷",
  SUCHE_PRODUKTY:       "🌾",
  ZWIERZETA:            "🐾",
  MOTORYZACJA:          "🚗",
  CZESCI_SAMOCHODOWE:   "🔧",
  AKCESORIA_AUTO:       "🚘",
  BIURO:                "📎",
  SZKOLA:               "✏️",
  BUDOWNICTWO:          "🏗️",
  NARZEDZIA:            "🔨",
  FOTOGRAFIA:           "📷",
  MUZYCZNE_INSTRUMENTY: "🎸",
  PODROZE:              "✈️",
  INNE:                 "📦",
};

/** Lista do pól wyboru, posortowana po etykiecie regułami polskimi. */
export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as ProductCategory[])
  .map((value) => ({ value, label: CATEGORY_LABELS[value], icon: CATEGORY_ICONS[value] }))
  .sort((a, b) => a.label.localeCompare(b.label, "pl"));

/** Etykieta z zapasem: kategoria spoza listy nie może wywalić widoku. */
export function etykietaKategorii(value?: string | null): string {
  if (!value) return "Bez kategorii";
  return CATEGORY_LABELS[value as ProductCategory] ?? value;
}

export function ikonaKategorii(value?: string | null): string {
  if (!value) return "📦";
  return CATEGORY_ICONS[value as ProductCategory] ?? "📦";
}
