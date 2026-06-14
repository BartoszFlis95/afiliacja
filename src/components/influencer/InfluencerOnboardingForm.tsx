// src/app/(dashboard)/influencer/onboarding/OnboardingForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createInfluencerProfileAction } from "@/actions/influencer.actions";
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
          <div className="space-y-2">
            <Label htmlFor="displayName">Nazwa wyświetlana *</Label>
            <Input id="displayName" name="displayName" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Strona WWW</Label>
            <Input id="website" name="website" type="url" placeholder="https://" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input id="instagramUrl" name="instagramUrl" type="url" placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input id="youtubeUrl" name="youtubeUrl" type="url" placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktokUrl">TikTok</Label>
              <Input id="tiktokUrl" name="tiktokUrl" type="url" placeholder="https://" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followersCount">Liczba obserwujących</Label>
            <Input
              id="followersCount"
              name="followersCount"
              type="number"
              min={0}
              placeholder="0"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Zapisywanie..." : "Zapisz profil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
