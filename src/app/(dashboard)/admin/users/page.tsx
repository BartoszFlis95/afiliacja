// src/app/(dashboard)/admin/users/page.tsx
import { redirect } from "next/navigation";

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
import { ToggleUserButton } from "@/components/admin/ToggleUserButton";

export const dynamic = "force-dynamic";

function StripeStatusBadge({
  stripeAccountId,
  stripeOnboardingDone,
}: {
  stripeAccountId: string | null;
  stripeOnboardingDone: boolean;
}) {
  if (stripeOnboardingDone) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Stripe aktywny</Badge>;
  }
  if (stripeAccountId) {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">⏳ Stripe w weryfikacji</Badge>;
  }
  return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">❌ Brak Stripe</Badge>;
}

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    include: { brandProfile: true, influencerProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Użytkownicy</h1>
        <p className="mt-1 text-muted-foreground">
          {users.length.toLocaleString("pl-PL")} kont w systemie.
        </p>
      </header>

      <div className="rounded-lg border">
        <Table>
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
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Brak użytkowników.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
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
                    <ToggleUserButton userId={user.id} />
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
