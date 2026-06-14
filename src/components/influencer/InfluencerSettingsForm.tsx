// src/app/(dashboard)/influencer/settings/SettingsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateInfluencerProfileAction } from "@/actions/influencer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card>
      <CardHeader>
        <CardTitle>Profil influencera</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nazwa wyświetlana *</Label>
            <Input
              id="displayName"
              name="displayName"
              required
              defaultValue={profile.displayName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Strona WWW</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                defaultValue={profile.instagramUrl ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input
                id="youtubeUrl"
                name="youtubeUrl"
                type="url"
                defaultValue={profile.youtubeUrl ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktokUrl">TikTok</Label>
              <Input
                id="tiktokUrl"
                name="tiktokUrl"
                type="url"
                defaultValue={profile.tiktokUrl ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followersCount">Liczba obserwujących</Label>
            <Input
              id="followersCount"
              name="followersCount"
              type="number"
              min={0}
              defaultValue={profile.followersCount}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-600">Zapisano zmiany.</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
