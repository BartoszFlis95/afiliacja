"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateInfluencerProfileAction } from "@/actions/influencer.actions";
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

type InfluencerProfileValues = {
  displayName: string;
  bio: string | null;
  website: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  followersCount: number;
};

export function SettingsForm({ profile }: { profile: InfluencerProfileValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

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
      const result = await updateInfluencerProfileAction(payload);
      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "Wystąpił błąd");
      }
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Profil influencera</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Nazwa wyświetlana" required>
              {(f) => (
                <Input
                  {...f}
                  name="displayName"
                  required
                  autoComplete="nickname"
                  defaultValue={profile.displayName}
                />
              )}
            </FormField>

            <FormField label="Strona WWW">
              {(f) => (
                <Input
                  {...f}
                  name="website"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  defaultValue={profile.website ?? ""}
                />
              )}
            </FormField>

            <FormField
              label="Bio"
              className="md:col-span-2"
              hint="Krótko o sobie — marki to widzą przy Twoim profilu."
            >
              {(f) => (
                <Textarea {...f} name="bio" rows={3} defaultValue={profile.bio ?? ""} />
              )}
            </FormField>

            <FormField label="Instagram">
              {(f) => (
                <Input
                  {...f}
                  name="instagramUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  defaultValue={profile.instagramUrl ?? ""}
                />
              )}
            </FormField>
            <FormField label="YouTube">
              {(f) => (
                <Input
                  {...f}
                  name="youtubeUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  defaultValue={profile.youtubeUrl ?? ""}
                />
              )}
            </FormField>
            <FormField label="TikTok">
              {(f) => (
                <Input
                  {...f}
                  name="tiktokUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  defaultValue={profile.tiktokUrl ?? ""}
                />
              )}
            </FormField>
            <FormField label="Liczba obserwujących">
              {(f) => (
                <Input
                  {...f}
                  name="followersCount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={profile.followersCount}
                />
              )}
            </FormField>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {saved && (
            <p
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            >
              Zapisano zmiany.
            </p>
          )}

          <Button
            type="submit"
            loading={isPending}
            className="w-full md:w-auto"
          >
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
