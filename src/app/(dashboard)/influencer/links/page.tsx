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
          <h1 className="text-2xl font-bold text-foreground">Moje linki</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {links.length.toLocaleString("pl-PL")} linków afiliacyjnych.
          </p>
        </header>

        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-border bg-card p-1">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              asChild
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-3 text-xs font-medium hover:bg-muted",
                sort === opt.value &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
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
              <div className="relative h-40 w-full bg-muted">
                {link.product?.imageUrl ? (
                  <Image
                    src={link.product.imageUrl}
                    alt={link.product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/60">
                    <LinkIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="line-clamp-1 font-medium text-foreground">
                    {link.product?.name ?? "—"}
                  </p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {link.product?.brandProfile?.companyName ?? "—"}
                  </p>
                </div>

                <p className="inline-block rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  {link.product?.influencerCommissionRate ?? 0}% prowizji
                </p>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {link.totalClicks.toLocaleString("pl-PL")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Kliknięcia</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {link.totalConversions.toLocaleString("pl-PL")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Konwersje</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-success">
                      {formatCurrency(Number(link.totalEarnings))}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Zarobki</p>
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
