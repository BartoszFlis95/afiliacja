/**
 * Jednorazowy backfill numerów rachunków.
 *
 * Zamraża numery w postaci, w jakiej wyliczały się dotąd, żeby dokumenty już
 * pobrane przez influencerów nie zmieniły numeru. Dopiero nowe wypłaty
 * dostają numery z sekwencji (nadaj-numer.ts).
 *
 * Uruchomienie:  npx tsx scripts/backfill-numery-dokumentow.ts
 * Podgląd bez zapisu:  npx tsx scripts/backfill-numery-dokumentow.ts --dry-run
 */

import { PrismaClient } from "@prisma/client";

import { formatujNumerDokumentu } from "../src/lib/numer-dokumentu";

const prisma = new PrismaClient();
const naSucho = process.argv.includes("--dry-run");

async function main() {
  // ta sama kolejność co w liście dokumentów: requestedAt, remis po id
  const wyplaty = await prisma.payout.findMany({
    orderBy: [{ requestedAt: "asc" }, { id: "asc" }],
    select: { id: true, requestedAt: true, status: true, documentNumber: true },
  });

  const licznikRoku = new Map<number, number>();
  let nadane = 0;
  let pominiete = 0;

  for (const w of wyplaty) {
    const rok = w.requestedAt.getFullYear();
    const pozycja = (licznikRoku.get(rok) ?? 0) + 1;
    licznikRoku.set(rok, pozycja);

    // pozycję liczymy dla WSZYSTKICH wypłat, bo tak liczył ją dotychczasowy
    // kod — inaczej zamrożone numery nie zgadzałyby się z już pobranymi
    if (w.documentNumber) {
      pominiete++;
      continue;
    }
    if (w.status !== "COMPLETED") continue;

    const numer = formatujNumerDokumentu(rok, pozycja);
    if (naSucho) {
      console.log(`  ${w.id} -> ${numer}`);
    } else {
      await prisma.payout.update({
        where: { id: w.id },
        data: { documentNumber: numer, documentSeq: pozycja },
      });
    }
    nadane++;
  }

  console.log(
    naSucho
      ? `\n[na sucho] do nadania: ${nadane}, już mają numer: ${pominiete}`
      : `\nnadano numerów: ${nadane}, pominięto (już miały): ${pominiete}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
