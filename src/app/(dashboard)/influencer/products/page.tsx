import { redirect } from "next/navigation";
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

export const dynamic = "force-dynamic";

export default async function InfluencerProductsPage() {
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

  const [products, existingLinks] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
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
  ]);

  const linkByProduct = new Map(
    existingLinks.map((link) => [link.productId, link.code])
  );

  // Serializujemy Decimal → number żeby uniknąć błędu Client Component
  const serializedProducts = products.map((product) => ({
    ...product,
    price: product.price ? Number(product.price) : null,
    commissionRate: Number(product.commissionRate),
    brandProfile: product.brandProfile
      ? {
          ...product.brandProfile,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Produkty do promocji
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wygeneruj link afiliacyjny i zacznij zarabiać.
        </p>
      </header>

      {serializedProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-20 text-center text-zinc-400">
          Brak dostępnych produktów.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serializedProducts.map((product) => {
            const code = linkByProduct.get(product.id);
            return (
              <Card
                key={product.id}
                className="flex flex-col border-zinc-200 bg-white"
              >
                <CardHeader className="space-y-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-sm font-semibold text-zinc-900 leading-tight">
                      {product.name}
                    </h2>
                    <Badge variant="default" className="shrink-0">
                      {product.commissionRate.toFixed(1).replace(/\.0$/, "")}%
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {product.brandProfile?.companyName ?? "—"}
                  </p>
                </CardHeader>

                <CardContent className="flex items-center justify-between pb-2">
                  {product.category ? (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                  <span className="text-sm font-bold text-zinc-900">
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