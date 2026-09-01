import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Link as LinkIcon } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { CopyLinkButton } from "@/components/influencer/CopyLinkButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SortOption = "newest" | "clicks" | "earnings";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "clicks", label: "Kliknięcia" },
  { value: "earnings", label: "Zarobki" },
];

export default async function InfluencerLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
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

  const params = await searchParams;
  const sort: SortOption = (["newest", "clicks", "earnings"] as string[]).includes(
    params.sort ?? ""
  )
    ? (params.sort as SortOption)
    : "newest";

  const orderBy =
    sort === "clicks"
      ? { totalClicks: "desc" as const }
      : sort === "earnings"
      ? { totalEarnings: "desc" as const }
      : { createdAt: "desc" as const };

  const links = await prisma.affiliateLink.findMany({
    where: { influencerProfileId: profile.id },
    include: { product: { include: { brandProfile: true } } },
    orderBy,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <header>
          <h1 className="text-2xl font-bold text-[#0F172A]">Moje linki</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {links.length.toLocaleString("pl-PL")} linków afiliacyjnych.
          </p>
        </header>

        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-slate-200 bg-white p-1">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-3 text-xs font-medium hover:bg-slate-100",
                sort === opt.value &&
                  "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
              )}
            >
              <Link href={`/influencer/links?sort=${opt.value}`}>{opt.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {links.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title="Nie masz jeszcze żadnych linków"
          description="Przejdź do Produktów i wygeneruj swój pierwszy link afiliacyjny."
          action={
            <Button asChild size="sm">
              <Link href="/influencer/products">Przeglądaj produkty</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Card key={link.id} className="overflow-hidden">
              <div className="relative h-40 w-full bg-slate-100">
                {link.product?.imageUrl ? (
                  <Image
                    src={link.product.imageUrl}
                    alt={link.product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <LinkIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="line-clamp-1 font-medium text-slate-900">
                    {link.product?.name ?? "—"}
                  </p>
                  <p className="line-clamp-1 text-sm text-slate-500">
                    {link.product?.brandProfile?.companyName ?? "—"}
                  </p>
                </div>

                <p className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {link.product?.influencerCommissionRate ?? 0}% prowizji
                </p>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {link.totalClicks.toLocaleString("pl-PL")}
                    </p>
                    <p className="text-[11px] text-slate-500">Kliknięcia</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {link.totalConversions.toLocaleString("pl-PL")}
                    </p>
                    <p className="text-[11px] text-slate-500">Konwersje</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(Number(link.totalEarnings))}
                    </p>
                    <p className="text-[11px] text-slate-500">Zarobki</p>
                  </div>
                </div>

                <CopyLinkButton code={link.code} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
