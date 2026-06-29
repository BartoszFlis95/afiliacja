"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateBrandProfileAction } from "@/actions/brand.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Profil marki</CardTitle>
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
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Krótki opis Twojej marki..."
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
              Profil został zaktualizowany.
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}