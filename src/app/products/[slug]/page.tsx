import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ImageIcon } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerateLinkButton } from "@/components/influencer/GenerateLinkButton";
import { CopyLinkButton } from "@/components/influencer/CopyLinkButton";
import { etykietaKategorii, ikonaKategorii } from "@/lib/categories";
import { bezpieczneJsonLd } from "@/lib/json-ld";

export const dynamic = "force-dynamic";

/**
 * Strony produktów to jedyna treść tego serwisu, która ma realną szansę
 * rankować w wyszukiwarce — jest ich tyle, ile produktów w katalogu, a każda
 * odpowiada na konkretne zapytanie. Bez generateMetadata wszystkie dostawały
 * domyślny tytuł i opis z root layoutu, czyli w wynikach wyglądały identycznie.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      category: true,
      imageUrl: true,
      status: true,
      commissionRate: true,
      brandProfile: { select: { companyName: true } },
    },
  });

  if (!product || product.status !== "ACTIVE") {
    return { title: "Produkt niedostępny", robots: { index: false, follow: false } };
  }

  const marka = product.brandProfile?.companyName ?? "Deneeu";
  const opis =
    product.description?.trim() ||
    `${product.name} od ${marka} w programie afiliacyjnym Deneeu. Prowizja ${Number(product.commissionRate)}% za każdą sprzedaż z Twojego linku.`;

  return {
    title: `${product.name} — ${marka}`,
    description: opis.slice(0, 160),
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      type: "website",
      title: `${product.name} — ${marka}`,
      description: opis.slice(0, 160),
      url: `/products/${slug}`,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : undefined,
    },
  };
}

export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { brandProfile: true },
  });

  if (!product || product.status !== "ACTIVE") {
    notFound();
  }

  /**
   * Dane strukturalne Product (schema.org). Bez nich Google widzi stronę
   * produktu jako zwykły tekst; z nimi może pokazać wynik rozszerzony
   * z ceną i marką, co realnie zmienia CTR.
   *
   * Świadomie NIE deklarujemy `offers.availability` ani `aggregateRating` —
   * nie mamy tych danych, a wymyślanie ich to naruszenie wytycznych Google
   * i ryzyko ręcznej kary.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.imageUrl ? { image: product.imageUrl } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.brandProfile?.companyName
      ? { brand: { "@type": "Brand", name: product.brandProfile.companyName } }
      : {}),
    ...(product.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: Number(product.price),
            priceCurrency: "PLN",
            url: product.productUrl || undefined,
          },
        }
      : {}),
  };

  const session = await auth();
  const isInfluencer = session?.user?.role === "INFLUENCER";

  let existingCode: string | null = null;
  if (isInfluencer && session?.user?.id) {
    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (profile) {
      const existingLink = await prisma.affiliateLink.findUnique({
        where: {
          influencerProfileId_productId: {
            influencerProfileId: profile.id,
            productId: product.id,
          },
        },
        select: { code: true },
      });
      existingCode = existingLink?.code ?? null;
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        // escape "<" jest konieczny, nie ostrożnościowy — patrz lib/json-ld.ts
        dangerouslySetInnerHTML={{ __html: bezpieczneJsonLd(jsonLd) }}
      />
      <div className="min-h-screen bg-card">
      <nav className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            Deneeu
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">← Wszystkie produkty</Link>
          </Button>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Strona główna
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href="/products" className="transition-colors hover:text-foreground">
            Produkty
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium text-foreground">{product.name}</span>
        </nav>

        {/* Zdjęcie produktu */}
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-muted mb-8">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/60" />
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {product.category && (
            <Badge variant="outline">
              {ikonaKategorii(product.category)} {etykietaKategorii(product.category)}
            </Badge>
          )}
          <Badge variant="secondary">
            Prowizja {Number(product.commissionRate).toFixed(1).replace(/\.0$/, "")}%
          </Badge>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {product.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {product.brandProfile?.companyName ?? "—"}
        </p>

        <p className="mt-6 text-3xl font-semibold text-foreground">
          {product.price ? formatCurrency(Number(product.price)) : "—"}
        </p>

        {product.description && (
          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Opis
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        )}

        <div className="mt-8 max-w-xs space-y-3 rounded-2xl border border-border/60 bg-muted/50 p-5">
          {isInfluencer ? (
            existingCode ? (
              <>
                <Badge className="gap-1.5 bg-success/10 text-success hover:bg-success/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Już promujesz ten produkt
                </Badge>
                <CopyLinkButton code={existingCode} />
              </>
            ) : (
              <GenerateLinkButton productId={product.id} />
            )
          ) : (
            <Button
              asChild
              size="lg"
              className="w-full shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <Link href={`/login?callbackUrl=/products/${product.slug}`}>
                Zaloguj się aby promować
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
    </>
  );
}
