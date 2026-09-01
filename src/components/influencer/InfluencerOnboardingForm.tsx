// src/app/(dashboard)/influencer/onboarding/OnboardingForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createInfluencerProfileAction } from "@/actions/influencer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      displayName: String(formData.get("displayName") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      website: String(formData.get("website") ?? ""),
      instagramUrl: String(formData.get("instagramUrl") ?? ""),
      youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
      tiktokUrl: String(formData.get("tiktokUrl") ?? ""),
      followersCount: formData.get("followersCount")
        ? Number(formData.get("followersCount"))
        : undefined,
    };

    startTransition(async () => {
      const result = await createInfluencerProfileAction(payload);
      if (result.success) {
        router.push("/influencer/dashboard");
        router.refresh();
      } else {
        setError(result.error ?? "Wystąpił błąd");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil influencera</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nazwa wyświetlana" required>
            {(f) => (
              <Input
                {...f}
                name="displayName"
                required
                autoComplete="nickname"
                placeholder="Jak mają Cię widzieć marki"
              />
            )}
          </FormField>

          <FormField label="Bio" hint="Krótko o sobie — marki to widzą przy Twoim profilu.">
            {(f) => <Textarea {...f} name="bio" rows={3} />}
          </FormField>

          <FormField label="Strona WWW">
            {(f) => (
              <Input {...f} name="website" type="url" inputMode="url" placeholder="https://" />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Instagram">
              {(f) => (
                <Input {...f} name="instagramUrl" type="url" inputMode="url" placeholder="https://" />
              )}
            </FormField>
            <FormField label="YouTube">
              {(f) => (
                <Input {...f} name="youtubeUrl" type="url" inputMode="url" placeholder="https://" />
              )}
            </FormField>
            <FormField label="TikTok">
              {(f) => (
                <Input {...f} name="tiktokUrl" type="url" inputMode="url" placeholder="https://" />
              )}
            </FormField>
          </div>

          <FormField label="Liczba obserwujących">
            {(f) => (
              <Input
                {...f}
                name="followersCount"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
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

          <Button type="submit" loading={isPending} className="w-full">
            {isPending ? "Zapisywanie..." : "Zapisz profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
