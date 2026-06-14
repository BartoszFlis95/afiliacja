// src/app/(dashboard)/brand/products/new/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { ProductForm } from "@/components/brand/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await auth();
  if (session?.user?.role !== "BRAND") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nowy produkt</h1>
        <p className="mt-1 text-muted-foreground">
          Dodaj produkt, który influencerzy będą mogli promować.
        </p>
      </header>

      <ProductForm />
    </div>
  );
}
