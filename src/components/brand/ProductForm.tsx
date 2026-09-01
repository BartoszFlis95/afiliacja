"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ProductSchema, type ProductFormData } from "@/lib/validations/product.schema";
import { createProductAction, updateProductAction } from "@/actions/product.actions";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  mode?: "create" | "edit";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({ initialData, mode = "create" }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      category: "",
      commissionRate: 10,
      influencerCommissionRate: 5,
      productUrl: "",
      imageUrl: "",
      slug: "",
      status: "DRAFT",
    },
  });

  const commissionRateValue = watch("commissionRate") ?? 0;
  const influencerRateValue = watch("influencerCommissionRate") ?? 0;
  const platformRate = Math.max(0, commissionRateValue - influencerRateValue);
  const imageUrlValue = watch("imageUrl") ?? "";

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setValue("name", val);
    if (mode === "create") {
      setValue("slug", slugify(val));
    }
  }

  function onSubmit(data: ProductFormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && initialData?.id
          ? await updateProductAction(initialData.id, data)
          : await createProductAction(data);

      if (!result.success) {
        setError(result.error ?? "Wystąpił błąd");
        return;
      }
      router.push("/brand/products");
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === "edit" ? "Edytuj produkt" : "Nowy produkt"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <FormField label="Nazwa" required error={errors.name?.message}>
            {(field) => (
              <Input
                {...field}
                {...register("name")}
                onChange={handleNameChange}
                placeholder="Nazwa produktu"
              />
            )}
          </FormField>

          <FormField label="Opis" error={errors.description?.message}>
            {(field) => (
              <Textarea
                {...field}
                {...register("description")}
                placeholder="Opis produktu (opcjonalny)"
                rows={4}
              />
            )}
          </FormField>

          <FormField label="Kategoria" required error={errors.category?.message}>
            {(field) => (
              <Input
                {...field}
                {...register("category")}
                placeholder="np. Elektronika, Moda, Sport"
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Cena (PLN)" error={errors.price?.message}>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              )}
            </FormField>

            <FormField
              label="Prowizja całkowita (%)"
              required
              hint="Łączna kwota płacona platformie deneeu.pl"
              error={errors.commissionRate?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  {...register("commissionRate", { valueAsNumber: true })}
                  placeholder="10"
                />
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Dla influencera (%)"
              required
              hint="Musi być mniejsza lub równa prowizji całkowitej"
              error={errors.influencerCommissionRate?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...register("influencerCommissionRate", { valueAsNumber: true })}
                  placeholder="5"
                />
              )}
            </FormField>

            {/* Pole wyliczane — nie da się go edytować, więc jest tekstem
                z `aria-live`, a nie zablokowanym inputem: czytnik ekranu ogłasza
                nową wartość, gdy zmieni się któraś z dwóch prowizji powyżej. */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Prowizja platformy (%)</p>
              <output
                aria-live="polite"
                className="flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-sm font-semibold tabular-nums text-foreground"
              >
                {platformRate.toFixed(1).replace(/\.0$/, "")}%
              </output>
              <p className="text-xs text-muted-foreground">
                Automatycznie: całkowita − influencer
              </p>
            </div>
          </div>

          <FormField
            label="Link do produktu w sklepie"
            required
            hint="Klienci trafiają bezpośrednio na ten adres po kliknięciu linku afiliacyjnego."
            error={errors.productUrl?.message}
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                {...register("productUrl")}
                placeholder="https://twojsklep.pl/produkt/nazwa"
              />
            )}
          </FormField>

          <div className="space-y-2">
            <ImageUpload
              value={imageUrlValue}
              onChange={(url) => setValue("imageUrl", url, { shouldDirty: true, shouldValidate: false })}
              label="Zdjęcie produktu"
            />
            <input type="hidden" {...register("imageUrl")} />
          </div>

          <FormField
            label="Slug"
            required
            hint={
              <>
                Używany w URL: /products/<strong>{watch("slug") || "slug"}</strong>
              </>
            }
            error={errors.slug?.message}
          >
            {(field) => (
              <Input {...field} {...register("slug")} placeholder="slug-produktu" />
            )}
          </FormField>

          <FormField label="Status" required error={errors.status?.message}>
            {(field) => (
              <Select
                defaultValue={initialData?.status ?? "DRAFT"}
                onValueChange={(val) =>
                  setValue("status", val as "DRAFT" | "ACTIVE" | "INACTIVE")
                }
              >
                <SelectTrigger {...field}>
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Szkic</SelectItem>
                  <SelectItem value="ACTIVE">Aktywny</SelectItem>
                  <SelectItem value="INACTIVE">Nieaktywny</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={isPending}>
              {isPending
                ? mode === "edit"
                  ? "Zapisywanie..."
                  : "Tworzenie..."
                : mode === "edit"
                ? "Zapisz zmiany"
                : "Utwórz produkt"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/brand/products")}
            >
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
