"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateBrandProfileAction } from "@/actions/brand.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BrandProfileSchema = z.object({
  companyName: z.string().min(2, "Nazwa firmy musi mieć co najmniej 2 znaki"),
  industry: z.string().optional(),
  website: z.string().url("Nieprawidłowy URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

type BrandProfileFormData = z.infer<typeof BrandProfileSchema>;

type BrandProfileFormProps = {
  profile: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    userId: string;
    companyName: string;
    industry: string | null;
    website: string | null;
    logoUrl: string | null;
    isVerified: boolean;
  } | null;
}

export function BrandProfileForm({ profile }: BrandProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandProfileFormData>({
    resolver: zodResolver(BrandProfileSchema),
    defaultValues: {
      companyName: profile?.companyName ?? "",
      industry: profile?.industry ?? "",
      website: profile?.website ?? "",
      description: profile?.description ?? "",
    },
  });

  function onSubmit(data: BrandProfileFormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateBrandProfileAction(data);
      if (!result.success) {
        setError(result.error ?? "Wystąpił błąd");
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-4 md:p-6 md:pb-4">
        <CardTitle>Profil marki</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <FormField label="Nazwa firmy" required error={errors.companyName?.message}>
            {(field) => (
              <Input
                {...field}
                {...register("companyName")}
                placeholder="Nazwa Twojej firmy"
              />
            )}
          </FormField>

          <FormField label="Branża" error={errors.industry?.message}>
            {(field) => (
              <Input
                {...field}
                {...register("industry")}
                placeholder="np. Moda, Elektronika, Sport"
              />
            )}
          </FormField>

          <FormField label="Strona internetowa" error={errors.website?.message}>
            {(field) => (
              <Input
                {...field}
                type="url"
                inputMode="url"
                {...register("website")}
                placeholder="https://twojafirma.pl"
              />
            )}
          </FormField>

          <FormField label="Opis" error={errors.description?.message}>
            {(field) => (
              <Textarea
                {...field}
                {...register("description")}
                placeholder="Krótki opis Twojej marki..."
                rows={4}
              />
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
          {success && (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            >
              Profil został zaktualizowany.
            </p>
          )}

          <Button type="submit" loading={isPending}>
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}