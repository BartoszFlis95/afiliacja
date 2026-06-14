"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrandProfileAction } from "@/actions/brand.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nazwa firmy *</Label>
            <Input
              id="companyName"
              {...register("companyName")}
              placeholder="Nazwa Twojej firmy"
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Branża</Label>
            <Input
              id="industry"
              {...register("industry")}
              placeholder="np. Moda, Elektronika, Sport"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Strona internetowa</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://twojafirma.pl"
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis firmy</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Krótki opis Twojej marki..."
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Tworzenie profilu..." : "Utwórz profil i przejdź dalej"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
