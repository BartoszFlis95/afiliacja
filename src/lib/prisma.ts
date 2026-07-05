import { PrismaClient } from "@prisma/client";

// Neon usypia połączenia po bezczynności (autosuspend) — bez pgbouncer=true
// i connection_limit=1 Prisma czasem trafia na już zamknięte połączenie z puli
// i rzuca "Error in PostgreSQL connection: Error { kind: Closed, cause: None }".
// Dopisujemy te parametry programowo, więc działa to nawet jeśli ktoś zapomni
// ich dodać ręcznie w DATABASE_URL.
function buildDatasourceUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;

  const url = new URL(base);
  if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
  return url.toString();
}

// W trybie dev Next.js przeładowuje moduły przy każdej zmianie (hot reload),
// co bez singletona tworzyłoby nowe instancje PrismaClient i wyczerpywało
// pulę połączeń. Cache'ujemy instancję na obiekcie globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: buildDatasourceUrl(),
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
