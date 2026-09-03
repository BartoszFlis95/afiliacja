"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BrandProfileSchema } from "@/lib/validations/profile.schema";
import { updateBrandProfileAction } from "@/actions/brand.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    nip: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
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
      nip: profile?.nip ?? "",
      address: profile?.address ?? "",
      city: profile?.city ?? "",
      postalCode: profile?.postalCode ?? "",
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

          {/*
            Dane do faktury. Bez NIP-u nie da się wystawić marce faktury VAT
            (art. 106e ust. 1 pkt 5 ustawy o VAT), a generowanie faktury
            odmawia z jasnym komunikatem — więc lepiej zebrać je tutaj niż
            zderzać admina z blokadą przy rozliczeniu.
          */}
          <fieldset className="space-y-5 rounded-xl border border-border/60 p-4">
            <legend className="px-1 text-sm font-medium text-foreground">
              Dane do faktury
            </legend>

            <FormField
              label="NIP"
              hint="10 cyfr. Bez NIP-u nie wystawimy faktury VAT."
              error={errors.nip?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  {...register("nip")}
                  inputMode="numeric"
                  placeholder="1234563218"
                />
              )}
            </FormField>

            <FormField label="Adres" error={errors.address?.message}>
              {(field) => (
                <Input {...field} {...register("address")} placeholder="ul. Prosta 51" />
              )}
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Kod pocztowy" error={errors.postalCode?.message}>
                {(field) => (
                  <Input {...field} {...register("postalCode")} placeholder="00-838" />
                )}
              </FormField>
              <FormField label="Miasto" error={errors.city?.message}>
                {(field) => (
                  <Input {...field} {...register("city")} placeholder="Warszawa" />
                )}
              </FormField>
            </div>
          </fieldset>

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
              className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
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