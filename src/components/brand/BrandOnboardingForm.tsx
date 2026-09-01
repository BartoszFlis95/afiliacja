"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrandProfileAction } from "@/actions/brand.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OnboardingSchema = z.object({
  companyName: z.string().min(2, "Nazwa firmy musi mieć co najmniej 2 znaki"),
  industry: z.string().optional(),
  website: z.string().url("Nieprawidłowy URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof OnboardingSchema>;

export function BrandOnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(OnboardingSchema),
  });

  function onSubmit(data: OnboardingFormData) {
    setError(null);
    startTransition(async () => {
      const result = await createBrandProfileAction(data);
      if (!result.success) {
        setError(result.error ?? "Wystąpił błąd");
        return;
      }
      router.push("/brand/dashboard");
    });
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Skonfiguruj profil marki</CardTitle>
        <CardDescription>
          Uzupełnij dane swojej firmy, aby zacząć korzystać z platformy.
        </CardDescription>
      </CardHeader>
      <CardContent>
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

          <FormField label="Opis firmy" error={errors.description?.message}>
            {(field) => (
              <Textarea
                {...field}
                {...register("description")}
                placeholder="Krótki opis Twojej marki..."
                rows={3}
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

          <Button type="submit" className="w-full" loading={isPending}>
            {isPending ? "Tworzenie profilu..." : "Utwórz profil i przejdź dalej"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
