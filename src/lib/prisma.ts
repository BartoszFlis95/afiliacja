import { PrismaClient } from "@prisma/client";

// W trybie dev Next.js przeładowuje moduły przy każdej zmianie (hot reload),
// co bez singletona tworzyłoby nowe instancje PrismaClient i wyczerpywało
// pulę połączeń. Cache'ujemy instancję na obiekcie globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
