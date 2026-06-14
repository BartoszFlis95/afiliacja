import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getAllUsersAction } from "@/actions/admin.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleUserButton } from "./toggle-user-button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const users = await getAllUsersAction();

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
              <TableHead>Rejestracja</TableHead>
              <TableHead>Status</TableHead>
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
                    {profileLabel(user)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Aktywny" : "Zablokowany"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ToggleUserButton
                      userId={user.id}
                      isActive={user.isActive}
                    />
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

function profileLabel(user: {
  brandProfile: { companyName: string | null } | null;
  influencerProfile: { displayName: string | null } | null;
}): string {
  if (user.brandProfile?.companyName) {
    return user.brandProfile.companyName;
  }
  if (user.influencerProfile?.displayName) {
    return user.influencerProfile.displayName;
  }
  return "—";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);
}
