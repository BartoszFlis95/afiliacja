import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerateLinkButton } from "@/components/influencer/GenerateLinkButton";
import { CopyLinkButton } from "@/components/influencer/CopyLinkButton";

export const dynamic = "force-dynamic";

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

  const session = await auth();
  const isInfluencer = session?.user?.role === "INFLUENCER";

  // Sprawdź czy influencer już ma link dla tego produktu
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
    <div className="min-h-screen bg-white">
      <nav className="border-b border-zinc-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
            Deneeu
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">← Wszystkie produkty</Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {product.category && (
            <Badge variant="outline">{product.category}</Badge>
          )}
          <Badge variant="secondary">
            Prowizja {Number(product.commissionRate).toFixed(1).replace(/\.0$/, "")}%
          </Badge>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {product.name}
        </h1>
        <p className="mt-2 text-zinc-500">
          {product.brandProfile?.companyName ?? "—"}
        </p>

        <p className="mt-6 text-3xl font-bold text-zinc-900">
          {product.price ? formatCurrency(Number(product.price)) : "—"}
        </p>

        {product.description && (
          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Opis
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-zinc-600">
              {product.description}
            </p>
          </div>
        )}

        <div className="mt-8 max-w-xs space-y-2">
          {isInfluencer ? (
            existingCode ? (
              <>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  ✓ Już promujesz ten produkt
                </Badge>
                <CopyLinkButton code={existingCode} />
              </>
            ) : (
              <GenerateLinkButton productId={product.id} />
            )
          ) : (
            <Button asChild size="lg" variant="secondary" className="w-full">
              <Link href={`/login?callbackUrl=/products/${product.slug}`}>
                Zaloguj się aby promować
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}