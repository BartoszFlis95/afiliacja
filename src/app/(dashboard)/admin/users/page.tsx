// src/app/(dashboard)/admin/users/page.tsx
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserDetailsButton } from "@/components/admin/UserDetailsButton";

export const dynamic = "force-dynamic";

function StripeStatusBadge({
  stripeAccountId,
  stripeOnboardingDone,
}: {
  stripeAccountId: string | null;
  stripeOnboardingDone: boolean;
}) {
  if (stripeOnboardingDone) {
    return <Badge className="bg-success/15 text-success hover:bg-success/15">✅ Stripe aktywny</Badge>;
  }
  if (stripeAccountId) {
    return <Badge className="bg-warning/15 text-warning hover:bg-warning/15">⏳ Stripe w weryfikacji</Badge>;
  }
  return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">❌ Brak Stripe</Badge>;
}

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  // select zamiast include: passwordHash, apiKey, webhookSecret i pełne dane
  // bankowe nigdy nie są pobierane z bazy dla tego widoku.
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      brandProfile: {
        select: {
          companyName: true,
          industry: true,
          website: true,
          isVerified: true,
        },
      },
      influencerProfile: {
        select: {
          displayName: true,
          city: true,
          country: true,
          followersCount: true,
          stripeAccountId: true,
          stripeOnboardingDone: true,
          bankAccountIban: true,
          paypalEmail: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Granica Server → Client Component (UserDetailsButton to "use client"):
  // IBAN/PayPal są tu tylko po to, by ustalić obecność metody wypłat — do
  // klienta trafiają wyłącznie flagi boolean, nigdy surowe wartości.
  const usersForDisplay = users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    brandProfile: user.brandProfile,
    influencerProfile: user.influencerProfile
      ? {
          displayName: user.influencerProfile.displayName,
          city: user.influencerProfile.city,
          country: user.influencerProfile.country,
          followersCount: user.influencerProfile.followersCount,
          stripeAccountId: user.influencerProfile.stripeAccountId,
          stripeOnboardingDone: user.influencerProfile.stripeOnboardingDone,
          hasIban: Boolean(user.influencerProfile.bankAccountIban),
          hasPaypal: Boolean(user.influencerProfile.paypalEmail),
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Użytkownicy</h1>
        <p className="mt-1 text-muted-foreground">
          {usersForDisplay.length.toLocaleString("pl-PL")} kont w systemie.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Profil</TableHead>
              <TableHead>Stripe</TableHead>
              <TableHead>Rejestracja</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersForDisplay.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Users}
                    title="Brak użytkowników"
                    description="Na razie nikt się nie zarejestrował."
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            ) : (
              usersForDisplay.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.brandProfile?.companyName ??
                      user.influencerProfile?.displayName ??
                      "—"}
                  </TableCell>
                  <TableCell>
                    {user.role === "INFLUENCER" && user.influencerProfile ? (
                      <StripeStatusBadge
                        stripeAccountId={user.influencerProfile.stripeAccountId}
                        stripeOnboardingDone={user.influencerProfile.stripeOnboardingDone}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserDetailsButton user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
