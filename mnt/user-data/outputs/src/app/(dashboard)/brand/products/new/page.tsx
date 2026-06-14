import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/brand/ProductForm";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "BRAND") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nowy produkt</h1>
        <p className="text-muted-foreground mt-1">
          Wypełnij formularz, aby dodać nowy produkt afiliacyjny.
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
