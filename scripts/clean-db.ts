/**
 * Czyszczenie bazy do stanu z trzema kontami testowymi.
 *
 * UWAGA: operacja nieodwracalna. Skrypt wymaga potwierdzenia flagą --tak,
 * żeby przypadkowe uruchomienie (autouzupełnianie w terminalu, pomyłka
 * w skrypcie CI) nie skasowało danych.
 *
 * Uruchomienie:
 *   npx tsx scripts/clean-db.ts            <- tylko podgląd, nic nie kasuje
 *   npx tsx scripts/clean-db.ts --tak      <- faktyczne czyszczenie
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KONTA_DO_ZACHOWANIA = [
  "admin@deneeu.com",
  "brand@deneeu.com",
  "influencer@deneeu.com",
];

const potwierdzone = process.argv.includes("--tak");

async function clean() {
  const uzytkownicy = await prisma.user.findMany({ select: { email: true, role: true } });
  const doUsuniecia = uzytkownicy.filter((u) => !KONTA_DO_ZACHOWANIA.includes(u.email));

  if (!potwierdzone) {
    console.log("PODGLĄD — nic nie zostanie usunięte. Dodaj --tak, aby wykonać.\n");
    console.log(`kont do usunięcia: ${doUsuniecia.length} z ${uzytkownicy.length}`);
    for (const u of doUsuniecia) console.log(`  ${u.role}: ${u.email}`);
    console.log(`\nprodukty: ${await prisma.product.count()}`);
    console.log(`kliknięcia: ${await prisma.click.count()}`);
    console.log(`prowizje: ${await prisma.commission.count()}`);
    return;
  }

  console.log("Czyszczenie bazy...");

  // Kolejność wynika z kluczy obcych: dziecko przed rodzicem.
  await prisma.fraudLog.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.conversion.deleteMany();
  await prisma.click.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.product.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  /**
   * VerificationToken nie ma klucza obcego do User — wiąże się z adresem
   * e-mail, nie z identyfikatorem konta. Bez tego kroku po usunięciu kont
   * zostałyby osierocone tokeny weryfikacyjne, a ponowna rejestracja na ten
   * sam adres trafiłaby na nieaktualny wpis.
   */
  await prisma.verificationToken.deleteMany({
    where: { identifier: { notIn: KONTA_DO_ZACHOWANIA } },
  });

  // Profile znikają kaskadowo razem z kontem, ale kasujemy je jawnie —
  // dzięki temu skrypt działa też wtedy, gdy profil istnieje bez konta.
  await prisma.brandProfile.deleteMany({
    where: { user: { email: { notIn: KONTA_DO_ZACHOWANIA } } },
  });
  await prisma.influencerProfile.deleteMany({
    where: { user: { email: { notIn: KONTA_DO_ZACHOWANIA } } },
  });

  // Account i Session mają onDelete: Cascade, więc znikają razem z kontem.
  await prisma.user.deleteMany({
    where: { email: { notIn: KONTA_DO_ZACHOWANIA } },
  });

  console.log("Baza wyczyszczona.\n");
  console.log("Pozostałe konta:");
  const pozostale = await prisma.user.findMany({ select: { email: true, role: true } });
  for (const u of pozostale) console.log(`  ${u.role}: ${u.email}`);
}

clean()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
