import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/brand/ProductForm";

export const dynamic = "force-dynamic";

export default async function BrandProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!brandProfile) {
    redirect("/brand/onboarding");
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      price: true,
      commissionRate: true,
      influencerCommissionRate: true,
      productUrl: true,
      imageUrl: true,
      slug: true,
      status: true,
      brandProfileId: true,
    },
  });

  if (!product || product.brandProfileId !== brandProfile.id) {
    notFound();
  }

  const initialData = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    // produkt sprzed migracji kategorii może nie mieć żadnej — wtedy pole
    // startuje puste i formularz wymusi wybór z listy
    category: product.category ?? undefined,
    price: product.price ? Number(product.price) : undefined,
    commissionRate: Number(product.commissionRate),
    influencerCommissionRate: Number(product.influencerCommissionRate),
    productUrl: product.productUrl,
    imageUrl: product.imageUrl ?? "",
    slug: product.slug,
    status: product.status as "DRAFT" | "ACTIVE" | "INACTIVE",
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-2xl font-bold text-foreground">Edytuj produkt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zmień dane produktu lub zaktualizuj zdjęcie.
        </p>
      </header>

      <ProductForm initialData={initialData} mode="edit" />
    </div>
  );
}
