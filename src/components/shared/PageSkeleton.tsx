import { Skeleton } from "@/components/ui/skeleton";

/**
 * Klocki do budowania stanów ładowania.
 *
 * Zasada: skeleton ma odwzorować układ, który faktycznie się pojawi.
 * Skeleton obiecujący sześć kart statystyk na stronie z formularzem jest
 * gorszy niż brak skeletonu — użytkownik widzi przeskok layoutu.
 * Dlatego neutralny wariant poniżej celowo nie udaje konkretnej treści.
 */

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-48 rounded-md" />
      <Skeleton className="h-4 w-64 rounded-md" />
    </div>
  );
}

/** Wiersze tabeli — dla stron listy z <Table>. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** Siatka kart — dla list renderowanych jako karty, nie tabela. */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className="h-56 rounded-xl" />
      ))}
    </div>
  );
}

/** Formularz — etykieta + pole, powtórzone. */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-36 rounded-md" />
    </div>
  );
}

/**
 * Neutralny stan dla tras, które nie mają własnego loading.tsx.
 * Pokazuje tylko nagłówek i jeden blok treści — nie zgaduje układu.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
