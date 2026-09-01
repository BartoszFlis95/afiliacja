import Image from "next/image";
import { redirect } from "next/navigation";
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
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Produkty do promocji
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Wygeneruj link afiliacyjny i zacznij zarabiać.
        </p>
      </header>

      {serializedProducts.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Brak dostępnych produktów"
          description="Marki nie dodały jeszcze żadnego aktywnego produktu do promocji."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serializedProducts.map((product) => {
            const code = linkByProduct.get(product.id);
            return (
              <Card
                key={product.id}
                className="flex flex-col border-slate-200 bg-white overflow-hidden"
              >
                {/* Miniaturka produktu */}
                <div className="relative w-full h-40 bg-slate-100 flex-shrink-0">
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
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                </div>

                <CardHeader className="space-y-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 text-sm font-semibold text-slate-900 leading-tight">
                      {product.name}
                    </h2>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <Badge variant="default">
                        {product.influencerCommissionRate.toFixed(1).replace(/\.0$/, "")}%
                      </Badge>
                      <span className="text-[10px] text-slate-400">Twoja prowizja</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    {product.brandProfile?.companyName ?? "—"}
                  </p>
                </CardHeader>

                <CardContent className="flex items-center justify-between pb-2">
                  {product.category ? (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                  <span className="text-sm font-bold text-slate-900">
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
