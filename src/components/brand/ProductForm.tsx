"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ProductSchema, type ProductFormData } from "@/lib/validations/product.schema";
import { createProductAction, updateProductAction } from "@/actions/product.actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      slug: "",
      status: "DRAFT",
    },
  });

  const nameValue = watch("name");

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nazwa *</Label>
            <Input
              id="name"
              {...register("name")}
              onChange={handleNameChange}
              placeholder="Nazwa produktu"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Opis produktu (opcjonalny)"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategoria *</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="np. Elektronika, Moda, Sport"
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cena (PLN)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissionRate">Prowizja (%) *</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                {...register("commissionRate", { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.commissionRate && (
                <p className="text-sm text-destructive">
                  {errors.commissionRate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="slug-produktu"
            />
            <p className="text-xs text-muted-foreground">
              Używany w URL: /products/<strong>{watch("slug") || "slug"}</strong>
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              defaultValue={initialData?.status ?? "DRAFT"}
              onValueChange={(val) =>
                setValue("status", val as "DRAFT" | "ACTIVE" | "INACTIVE")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Szkic</SelectItem>
                <SelectItem value="ACTIVE">Aktywny</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
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
