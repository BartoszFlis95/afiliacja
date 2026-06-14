import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
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

  const session = await auth();
  const isInfluencer = session?.user?.role === "INFLUENCER";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Deneeu
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">← Wszystkie produkty</Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Brak zdjęcia
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {product.category && (
                <Badge variant="outline">{product.category}</Badge>
              )}
              <Badge variant="secondary">
                Prowizja {formatCommission(product.commissionRate)}%
              </Badge>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>

            <p className="mt-2 text-muted-foreground">
              {product.brandProfile?.companyName ?? "Nieznana marka"}
            </p>

            <p className="mt-6 text-3xl font-bold">
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <div className="mt-6 space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Opis
                </h2>
                <p className="whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-auto pt-8">
              {isInfluencer ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/dashboard/links/new?productId=${product.id}`}>
                    Generuj link afiliacyjny
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary" className="w-full">
                  <Link
                    href={`/login?callbackUrl=/products/${product.slug}`}
                  >
                    Zaloguj się aby promować
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatCommission(rate: Prisma.Decimal | number): string {
  return Number(rate).toFixed(1).replace(/\.0$/, "");
}

function formatPrice(price: Prisma.Decimal | number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(Number(price));
}
