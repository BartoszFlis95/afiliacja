import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { CopyLinkButton } from "@/components/influencer/CopyLinkButton";
import { GenerateLinkButton } from "@/components/influencer/GenerateLinkButton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  etykietaKategorii,
  ikonaKategorii,
  kategoriaZParametru,
} from "@/lib/categories";
import { ProductCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { dozwolonyUrlObrazu } from "@/lib/image-hosts";
import { adresProduktow } from "@/lib/filtry-produktow";

export const dynamic = "force-dynamic";

/**
 * Logo marki w pigułce filtra.
 *
 * next/image na hoście spoza images.remotePatterns nie degraduje się po cichu,
 * tylko rzuca wyjątkiem — a logotypy zapisane zanim wprowadzono walidację
 * adresów mogą wskazywać dowolne miejsce. Sprawdzamy je tą samą funkcją co
 * przy zapisie i w razie czego pokazujemy inicjał, zamiast wywalić stronę.
 */
function LogoMarki({
  logoUrl,
  companyName,
  aktywna,
}: {
  logoUrl: string | null;
  companyName: string;
  aktywna: boolean;
}) {
  if (logoUrl && dozwolonyUrlObrazu(logoUrl)) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={16}
        height={16}
        className="h-4 w-4 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
        aktywna ? "bg-background/25 text-background" : "bg-muted-foreground/15 text-muted-foreground"
      )}
    >
      {companyName.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default async function InfluencerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brandId?: string }>;
}) {
  const { category: kategoriaZUrl, brandId } = await searchParams;

  const category = kategoriaZParametru(kategoriaZUrl);

  // undefined zachowuje bieżący filtr, null go czyści — patrz adresProduktow
  const adresFiltru = (zmiany: { category?: ProductCategory | null; brandId?: string | null }) =>
    adresProduktow({ category, brandId }, zmiany);

  const session = await auth();
  if (session?.user?.role !== "INFLUENCER") {
    redirect("/login");
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    redirect("/influencer/onboarding");
  }

  const [products, existingLinks, kategorieWBazie, dostepneMarki] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(category ? { category } : {}),
        ...(brandId ? { brandProfileId: brandId } : {}),
      },
      include: { brandProfile: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.affiliateLink.findMany({
      where: { influencerProfileId: profile.id },
      select: {
        productId: true,
        code: true,
      },
    }),
    // Kategorie liczone bez filtra — inaczej po kliknięciu w jedną pigułkę
    // pozostałe zniknęłyby z listy i nie dałoby się przełączyć.
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { category: true },
      distinct: ["category"],
    }),
    // Marki liczone bez aktywnych filtrów, z tego samego powodu co kategorie:
    // inaczej po wybraniu marki reszta zniknęłaby z listy.
    prisma.brandProfile.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      select: { id: true, companyName: true, logoUrl: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const nazwaAktywnejMarki = brandId
    ? (dostepneMarki.find((m) => m.id === brandId)?.companyName ?? null)
    : null;

  // produkt bez kategorii nie tworzy pigułki; sortujemy po etykiecie po polsku
  const dostepneKategorie = kategorieWBazie
    .map((p) => p.category)
    .filter((c): c is ProductCategory => c !== null)
    .sort((a, b) => CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b], "pl"));

  const linkByProduct = new Map(
    existingLinks.map((link) => [link.productId, link.code])
  );

  const serializedProducts = products.map((product) => ({
    ...product,
    price: product.price ? Number(product.price) : null,
    commissionRate: Number(product.commissionRate),
    influencerCommissionRate: Number(product.influencerCommissionRate),
    brandProfile: product.brandProfile
      ? { ...product.brandProfile }
      : null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">
          Produkty do promocji
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wygeneruj link afiliacyjny i zacznij zarabiać.
        </p>
      </header>

      {/*
        Pigułki filtrów. Kolory z tokenów motywu, a stan aktywny to
        bg-foreground/text-background — ten sam wzorzec co filtry statusu
        w panelu marki. Wartości na sztywno (bg-blue-500, bg-white) dawałyby
        białą pigułkę na ciemnym tle.
      */}
      {dostepneKategorie.length > 0 && (
        <div className="-mx-1 overflow-x-auto px-1 pb-2 no-scrollbar">
          <div
            className="flex w-max gap-2"
            role="group"
            aria-label="Filtruj produkty po kategorii"
          >
            <Button
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 shrink-0 rounded-full px-3.5 text-xs font-medium hover:bg-muted",
                !category &&
                  "bg-foreground text-background hover:bg-foreground hover:text-background"
              )}
            >
              <Link
                href={adresFiltru({ category: null })}
                aria-current={!category ? "true" : undefined}
              >
                🛍️ Wszystkie
              </Link>
            </Button>

            {dostepneKategorie.map((kat) => (
              <Button
                key={kat}
                asChild
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 shrink-0 rounded-full px-3.5 text-xs font-medium hover:bg-muted",
                  category === kat &&
                    "bg-foreground text-background hover:bg-foreground hover:text-background"
                )}
              >
                <Link
                  href={adresFiltru({ category: kat })}
                  aria-current={category === kat ? "true" : undefined}
                >
                  {CATEGORY_ICONS[kat]} {CATEGORY_LABELS[kat]}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {dostepneMarki.length > 1 && (
        <div className="-mx-1 overflow-x-auto px-1 pb-2 no-scrollbar">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Marka
          </p>
          <div
            className="flex w-max gap-2"
            role="group"
            aria-label="Filtruj produkty po marce"
          >
            <Button
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 shrink-0 rounded-full px-3.5 text-xs font-medium hover:bg-muted",
                !brandId &&
                  "bg-foreground text-background hover:bg-foreground hover:text-background"
              )}
            >
              <Link
                href={adresFiltru({ brandId: null })}
                aria-current={!brandId ? "true" : undefined}
              >
                Wszystkie marki
              </Link>
            </Button>

            {dostepneMarki.map((marka) => (
              <Button
                key={marka.id}
                asChild
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 shrink-0 gap-1.5 rounded-full px-3.5 text-xs font-medium hover:bg-muted",
                  brandId === marka.id &&
                    "bg-foreground text-background hover:bg-foreground hover:text-background"
                )}
              >
                <Link
                  href={adresFiltru({ brandId: marka.id })}
                  aria-current={brandId === marka.id ? "true" : undefined}
                >
                  <LogoMarki
                    logoUrl={marka.logoUrl}
                    companyName={marka.companyName}
                    aktywna={brandId === marka.id}
                  />
                  {marka.companyName}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {(category || brandId) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Aktywne filtry
          </span>

          {category && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
              {ikonaKategorii(category)} {etykietaKategorii(category)}
              <Link
                href={adresFiltru({ category: null })}
                aria-label={`Usuń filtr kategorii ${etykietaKategorii(category)}`}
                className="rounded-full px-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                ×
              </Link>
            </span>
          )}

          {brandId && nazwaAktywnejMarki && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
              {nazwaAktywnejMarki}
              <Link
                href={adresFiltru({ brandId: null })}
                aria-label={`Usuń filtr marki ${nazwaAktywnejMarki}`}
                className="rounded-full px-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                ×
              </Link>
            </span>
          )}

          <span className="text-xs text-muted-foreground">
            {serializedProducts.length.toLocaleString("pl-PL")}{" "}
            {serializedProducts.length === 1 ? "produkt" : "produktów"}
          </span>

          {category && brandId && (
            <Link href="/influencer/products" className="text-xs text-primary hover:underline">
              Usuń wszystkie filtry
            </Link>
          )}
        </div>
      )}

      {serializedProducts.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={
            category || brandId ? "Brak produktów dla tych filtrów" : "Brak dostępnych produktów"
          }
          description={
            // opisujemy filtr, który akurat zawęża — inaczej komunikat mówiłby
            // o kategorii także wtedy, gdy pusty wynik daje wybór marki
            category && nazwaAktywnejMarki
              ? `Marka ${nazwaAktywnejMarki} nie ma aktywnych produktów w kategorii ${etykietaKategorii(category)}.`
              : category
                ? `W kategorii ${etykietaKategorii(category)} nie ma na razie aktywnych produktów.`
                : nazwaAktywnejMarki
                  ? `Marka ${nazwaAktywnejMarki} nie ma teraz aktywnych produktów.`
                  : "Marki nie dodały jeszcze żadnego aktywnego produktu do promocji."
          }
          action={
            category || brandId ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/influencer/products">Zobacz wszystkie produkty</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serializedProducts.map((product) => {
            const code = linkByProduct.get(product.id);
            return (
              <Card
                key={product.id}
                className="flex flex-col border-border bg-card overflow-hidden"
              >
                {/* Miniaturka produktu */}
                <div className="relative w-full h-40 bg-muted flex-shrink-0">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
                    </div>
                  )}
                </div>

                <CardHeader className="space-y-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-sm font-semibold text-foreground leading-tight">
                      {product.name}
                    </h2>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <Badge variant="default">
                        {product.influencerCommissionRate.toFixed(1).replace(/\.0$/, "")}%
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">Twoja prowizja</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.brandProfile?.companyName ?? "—"}
                  </p>
                </CardHeader>

                <CardContent className="flex items-center justify-between pb-2">
                  {product.category ? (
                    <Badge variant="outline" className="text-xs">
                      {etykietaKategorii(product.category)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <span className="text-sm font-bold text-foreground">
                    {product.price ? formatCurrency(product.price) : "—"}
                  </span>
                </CardContent>

                <CardFooter className="mt-auto flex-col items-stretch gap-2">
                  {code ? (
                    <>
                      <Badge variant="success" className="w-fit">
                        ✓ Promujesz
                      </Badge>
                      <CopyLinkButton code={code} />
                    </>
                  ) : (
                    <GenerateLinkButton productId={product.id} />
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
