-- Kategorie produktów: wolny tekst -> enum.
--
-- Kolumna była TEXT wypełnianym ręcznie, więc w bazie siedziały wartości
-- takie jak "Bizuteria3" czy "L". Rzutowanie na enum wywala się na KAŻDEJ
-- wartości spoza listy, dlatego najpierw normalizujemy dane, a klauzula
-- ELSE 'INNE' gwarantuje, że po normalizacji nie zostanie nic nieznanego.

CREATE TYPE "ProductCategory" AS ENUM (
  'ELEKTRONIKA', 'KOMPUTERY', 'TELEFONY', 'AGD', 'RTV',
  'MODA_DAMSKA', 'MODA_MESKA', 'MODA_DZIECIECA', 'OBUWIE', 'TOREBKI',
  'BIZUTERIA', 'ZEGARKI', 'URODA', 'PERFUMY', 'PIELEGNACJA',
  'ZDROWIE', 'SUPLEMENTY', 'SPORT', 'FITNESS', 'OUTDOOR',
  'ROWERY', 'DOM', 'OGROD', 'MEBLE', 'DEKORACJE',
  'KUCHNIA', 'LAZIENKA', 'POSCIEL', 'ZABAWKI', 'GRY_PLANSZOWE',
  'KSIAZKI', 'MUZYKA', 'FILMY', 'GAMING', 'OPROGRAMOWANIE',
  'JEDZENIE', 'NAPOJE', 'ALKOHOL', 'SUCHE_PRODUKTY', 'ZWIERZETA',
  'MOTORYZACJA', 'CZESCI_SAMOCHODOWE', 'AKCESORIA_AUTO', 'BIURO', 'SZKOLA',
  'BUDOWNICTWO', 'NARZEDZIA', 'FOTOGRAFIA', 'MUZYCZNE_INSTRUMENTY', 'PODROZE',
  'INNE'
);

-- Normalizacja istniejących wartości. Dopasowanie po prefiksie i bez
-- względu na wielkość liter, bo dane wpisywano ręcznie ("Bizuteria3").
UPDATE "Product" SET "category" = CASE
  WHEN lower("category") LIKE 'laptop%'      THEN 'KOMPUTERY'
  WHEN lower("category") LIKE 'komputer%'    THEN 'KOMPUTERY'
  WHEN lower("category") LIKE 'elektronik%'  THEN 'ELEKTRONIKA'
  WHEN lower("category") LIKE 'telefon%'     THEN 'TELEFONY'
  WHEN lower("category") LIKE 'sport%'       THEN 'SPORT'
  WHEN lower("category") LIKE 'spozywcz%'    THEN 'JEDZENIE'
  WHEN lower("category") LIKE 'jedzenie%'    THEN 'JEDZENIE'
  WHEN lower("category") LIKE 'bizuteri%'    THEN 'BIZUTERIA'
  WHEN lower("category") LIKE 'zabawk%'      THEN 'ZABAWKI'
  WHEN lower("category") LIKE 'ksiaz%'       THEN 'KSIAZKI'
  WHEN lower("category") LIKE 'obuwie%'      THEN 'OBUWIE'
  WHEN lower("category") LIKE 'uroda%'       THEN 'URODA'
  WHEN lower("category") LIKE 'dom%'         THEN 'DOM'
  WHEN lower("category") LIKE 'ogrod%'       THEN 'OGROD'
  WHEN lower("category") LIKE 'motoryzacj%'  THEN 'MOTORYZACJA'
  -- "Ubrania", "Akcesoria", "L" i inne niejednoznaczne trafiają do INNE:
  -- zgadywanie płci czy podkategorii ubrań byłoby zmyślaniem danych.
  ELSE 'INNE'
END
WHERE "category" IS NOT NULL;

ALTER TABLE "Product"
  ALTER COLUMN "category" TYPE "ProductCategory"
  USING "category"::"ProductCategory";
