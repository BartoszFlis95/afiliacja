"use client";

import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserDetailsButtonProps {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    brandProfile: {
      companyName: string;
      industry: string | null;
      website: string | null;
      isVerified: boolean;
    } | null;
    influencerProfile: {
      displayName: string;
      city: string | null;
      country: string | null;
      followersCount: number | null;
      hasIban: boolean;
      hasPaypal: boolean;
      stripeAccountId: string | null;
      stripeOnboardingDone: boolean;
    } | null;
  };
}

export function UserDetailsButton({ user }: UserDetailsButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Szczegóły
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="normal-case tracking-normal">
            {user.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rola</span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data rejestracji</span>
            <span className="font-medium text-foreground">
              {formatDate(user.createdAt)}
            </span>
          </div>

          {user.brandProfile && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-3">
              <p className="font-semibold text-foreground">Profil marki</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Nazwa firmy</span>
                <span className="truncate font-medium text-foreground">
                  {user.brandProfile.companyName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Branża</span>
                <span className="truncate font-medium text-foreground">
                  {user.brandProfile.industry ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Strona www</span>
                <span className="truncate font-medium text-foreground">
                  {user.brandProfile.website ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Zweryfikowana</span>
                <span className="font-medium text-foreground">
                  {user.brandProfile.isVerified ? "Tak" : "Nie"}
                </span>
              </div>
            </div>
          )}

          {user.influencerProfile && (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-3">
              <p className="font-semibold text-foreground">Profil influencera</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Nazwa</span>
                <span className="truncate font-medium text-foreground">
                  {user.influencerProfile.displayName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Lokalizacja</span>
                <span className="truncate font-medium text-foreground">
                  {[user.influencerProfile.city, user.influencerProfile.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Obserwujący</span>
                <span className="font-medium text-foreground">
                  {user.influencerProfile.followersCount?.toLocaleString("pl-PL") ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Metoda wypłat</span>
                <span className="font-medium text-foreground">
                  {user.influencerProfile.hasIban
                    ? "IBAN"
                    : user.influencerProfile.hasPaypal
                    ? "PayPal"
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Stripe</span>
                <span className="font-medium text-foreground">
                  {user.influencerProfile.stripeOnboardingDone
                    ? "Aktywny"
                    : user.influencerProfile.stripeAccountId
                    ? "W weryfikacji"
                    : "Brak"}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
