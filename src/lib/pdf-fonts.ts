import path from "node:path";

import { Font } from "@react-pdf/renderer";

/**
 * Rejestracja fontu dla dokumentów PDF.
 *
 * DLACZEGO TO JEST KONIECZNE: oba szablony używały fontFamily "Helvetica",
 * czyli jednego z czternastu fontów wbudowanych w standard PDF. Te używają
 * kodowania WinAnsi, w którym NIE MA polskich znaków diakrytycznych.
 * Na wygenerowanej fakturze wychodziło m.in.:
 *   "1000,00 zł"        -> "1000,00 zB"      (przy KAŻDEJ kwocie)
 *   "Termin płatności"  -> "Termin pBatno[ci"
 *   "Ilość" / "Wartość" -> "Ilo[" / "Warto["
 *   "Gdańsk"            -> "GdaDsk"
 * czyli dokument księgowy wysyłany klientom był nieczytelny.
 *
 * Roboto (Apache 2.0) ma pełne pokrycie polskich znaków w obu wariantach —
 * sprawdzone w tablicy cmap, razem z myślnikiem półpauzą i symbolem euro.
 * Pliki są w repo, a nie pobierane w locie: generowanie faktury nie może
 * zależeć od dostępności zewnętrznego serwera.
 *
 * process.cwd() jest bezpieczne, bo PDF renderujemy wyłącznie po stronie
 * serwera, w trasach API.
 */
let zarejestrowany = false;

export function registerPdfFonts() {
  if (zarejestrowany) return;
  zarejestrowany = true;

  const dir = path.join(process.cwd(), "src", "fonts");

  Font.register({
    family: "Roboto",
    fonts: [
      { src: path.join(dir, "Roboto-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "Roboto-Bold.ttf"), fontWeight: "bold" },
    ],
  });

  // Bez tego @react-pdf dzieli długie słowa w losowych miejscach; dla nazw
  // produktów i firm lepszy jest brak dzielenia niż dzielenie błędne.
  Font.registerHyphenationCallback((slowo) => [slowo]);
}
