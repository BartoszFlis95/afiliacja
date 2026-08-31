"use client";

import { useState, useTransition } from "react";
import { Ticket } from "lucide-react";

import type { getInviteCodesAction } from "@/actions/admin.actions";
import {
  generateInviteCodeAction,
  toggleInviteCodeActiveAction,
} from "@/actions/admin.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type InviteCodeRow = Awaited<ReturnType<typeof getInviteCodesAction>>[number];

function inviteLink(code: string) {
  return `${window.location.origin}/register?invite=${code}`;
}

export function AdminInviteCodesClient({ codes }: { codes: InviteCodeRow[] }) {
  const [rows, setRows] = useState(codes);
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleGenerate() {
    startTransition(async () => {
      try {
        const created = await generateInviteCodeAction();
        setRows((prev) => [
          { ...created, createdBy: { email: "—" } },
          ...prev,
        ]);
        toast({ title: `Wygenerowano kod ${created.code}` });
      } catch (error) {
        toast({
          title: "Nie udało się wygenerować kodu",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      }
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      try {
        const updated = await toggleInviteCodeActiveAction(id);
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: updated.isActive } : r))
        );
      } catch (error) {
        toast({
          title: "Nie udało się zmienić statusu kodu",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      }
    });
  }

  async function handleCopy(id: string, code: string) {
    try {
      await navigator.clipboard.writeText(inviteLink(code));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Nie udało się skopiować linku", error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{rows.length.toLocaleString("pl-PL")} kodów</p>
        <Button size="sm" onClick={handleGenerate} disabled={isPending}>
          Wygeneruj kod
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Ticket} title="Brak wygenerowanych kodów zaproszeń" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Wykorzystanie</TableHead>
                <TableHead>Wygasa</TableHead>
                <TableHead>Utworzył</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isUsedUp = row.usedCount >= row.maxUses;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs text-slate-700">{row.code}</TableCell>
                    <TableCell>
                      {!row.isActive ? (
                        <Badge variant="destructive">Wyłączony</Badge>
                      ) : isUsedUp ? (
                        <Badge variant="warning">Wykorzystany</Badge>
                      ) : (
                        <Badge variant="success">Aktywny</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {row.usedCount} / {row.maxUses}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {row.expiresAt ? formatDate(row.expiresAt) : "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">{row.createdBy?.email ?? "—"}</TableCell>
                    <TableCell className="text-slate-500">{formatDate(row.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(row.id, row.code)}
                        >
                          {copiedId === row.id ? "Skopiowano!" : "Kopiuj link"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggle(row.id)}
                        >
                          {row.isActive ? "Wyłącz" : "Włącz"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
