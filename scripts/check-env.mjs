#!/usr/bin/env node
/**
 * Bramka konfiguracji do CI i deployu.
 *
 * Kończy się kodem != 0, gdy brakuje zmiennych z grupy "rdzeń" albo — przy
 * uruchomieniu z flagą --strict — z jakiejkolwiek grupy. Sens: lepiej zatrzymać
 * deploy z listą braków niż wypuścić aplikację, która wstanie i zepsuje się
 * dopiero przy pierwszej płatności albo pierwszej fakturze.
 *
 *   npm run check:env            sprawdza rdzeń, resztę raportuje
 *   npm run check:env -- --strict wymaga kompletu (do produkcji)
 */
import fs from "node:fs";
import path from "node:path";

// Wczytaj .env.local i .env, jeśli istnieją (node --env-file obsługuje jeden plik).
for (const plik of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), plik);
  if (!fs.existsSync(p)) continue;
  for (const linia of fs.readFileSync(p, "utf8").split("\n")) {
    const m = linia.match(/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const wartosc = m[2].trim().replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined && wartosc) process.env[m[1]] = wartosc;
  }
}

const { sprawdzKonfiguracje } = await import("../src/lib/env.ts").catch(async () => {
  // ts nie jest wykonywalny bezpośrednio — powiel definicje przez tsx, jeśli trzeba
  throw new Error("Uruchom przez: npm run check:env");
});

const strict = process.argv.includes("--strict");
const raport = sprawdzKonfiguracje();

let blad = false;
console.log("\nKONFIGURACJA ŚRODOWISKA\n");
for (const g of raport) {
  const status = g.kompletna ? "OK  " : "BRAK";
  console.log(`  [${status}] ${g.nazwa}`);
  if (!g.kompletna) {
    console.log(`         skutek: ${g.konsekwencja}`);
    console.log(`         brakuje: ${g.brakujace.join(", ")}`);
    if (g.nazwa === "rdzeń" || strict) blad = true;
  }
}
console.log();

if (blad) {
  console.error(
    strict
      ? "Konfiguracja niekompletna — deploy zatrzymany (--strict).\n"
      : "Brakuje zmiennych z grupy rdzeń — aplikacja nie wstanie.\n",
  );
  process.exit(1);
}
console.log("Konfiguracja wystarczająca do uruchomienia.\n");
