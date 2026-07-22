import { prisma } from "@/lib/prisma";

/**
 * Generuje kolejny numer faktury w formacie FV/{rok}/{numer}.
 *
 * Poprzednia wersja liczyła numer jako "ostatni + 1" (findFirst) w osobnym
 * kroku od docelowego prisma.invoice.create() w invoice.actions.ts — dwa
 * równoczesne wywołania mogły odczytać ten sam "ostatni numer" i wygenerować
 * identyczny invoiceNumber (P2002 przy create). Samo opakowanie tego pliku w
 * transakcję/advisory lock tego NIE rozwiązuje, bo blokada zwalnia się, zanim
 * create() (w innym pliku) w ogóle się wykona — drugie wywołanie i tak
 * odczytałoby ten sam "ostatni" wiersz, bo nic nowego jeszcze nie zapisano.
 *
 * Zamiast tego numer jest przydzielany z natywnej sekwencji Postgres
 * (nextval) per rok — nextval() jest atomowe na poziomie bazy niezależnie od
 * tego, w jakiej transakcji (lub bez niej) zostanie później wywołane
 * invoice.create(), więc dwa równoczesne wywołania fizycznie nie mogą dostać
 * tego samego numeru.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const sequenceName = `invoice_seq_${year}`;

  const [{ exists }] = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT to_regclass('"${sequenceName}"') IS NOT NULL AS exists`
  );

  if (!exists) {
    // Pierwsze użycie sekwencji w danym roku — start ustawiamy na podstawie
    // istniejących faktur (migracja ze starego, nieatomowego sposobu
    // liczenia numeru), żeby nie zdublować już wystawionych numerów.
    // Krótkie okno wyścigu przy tworzeniu samej sekwencji jest nieszkodliwe:
    // CREATE SEQUENCE IF NOT EXISTS jest idempotentne, a konkurujące
    // wywołania w tym jednorazowym momencie i tak odczytają ten sam punkt
    // startowy.
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `FV/${year}/` } },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    let startAt = 1;
    if (lastInvoice) {
      const parsed = parseInt(lastInvoice.invoiceNumber.split("/")[2], 10);
      if (!isNaN(parsed)) startAt = parsed + 1;
    }

    await prisma.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS "${sequenceName}" START WITH ${startAt}`
    );
  }

  const rows = await prisma.$queryRawUnsafe<{ nextval: number }[]>(
    `SELECT nextval('"${sequenceName}"')::int AS nextval`
  );
  const nextNumber = rows[0].nextval;

  return `FV/${year}/${String(nextNumber).padStart(3, "0")}`;
}
