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

export const dynamic = "force-dynamic";

export default async function InfluencerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: kategoriaZUrl } = await searchParams;

  const category = kategoriaZParametru(kategoriaZUrl);

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

  const [products, existingLinks, kategorieWBazie] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", ...(category ? { category } : {}) },
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
  ]);

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
                href="/influencer/products"
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
                  href={`/influencer/products?category=${kat}`}
                  aria-current={category === kat ? "true" : undefined}
                >
                  {CATEGORY_ICONS[kat]} {CATEGORY_LABELS[kat]}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {category && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            Filtr: {ikonaKategorii(category)} {etykietaKategorii(category)} —{" "}
            {serializedProducts.length.toLocaleString("pl-PL")}{" "}
            {serializedProducts.length === 1 ? "produkt" : "produktów"}
          </span>
          <Link href="/influencer/products" className="text-primary hover:underline">
            Usuń filtr
          </Link>
        </p>
      )}

      {serializedProducts.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={category ? "Brak produktów w tej kategorii" : "Brak dostępnych produktów"}
          description={
            category
              ? `W kategorii ${etykietaKategorii(category)} nie ma na razie aktywnych produktów. Sprawdź pozostałe kategorie.`
              : "Marki nie dodały jeszcze żadnego aktywnego produktu do promocji."
          }
          action={
            category ? (
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
