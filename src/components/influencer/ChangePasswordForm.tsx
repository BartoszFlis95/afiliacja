"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/influencer.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są zgodne");
      return;
    }
    if (newPassword.length < 8) {
      setError("Nowe hasło musi mieć co najmniej 8 znaków");
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        toast.success("Hasło zostało zmienione.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error ?? "Nieznany błąd");
      }
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-4 md:p-6 md:pb-4">
        <CardTitle className="text-base md:text-lg">Zmiana hasła</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-full md:max-w-sm">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Aktualne hasło</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isPending}
              required
            />
          </div>

          <Button
            type="submit"
            loading={isPending}
            className="w-full md:w-auto"
          >
            {isPending ? "Zmienianie…" : "Zmień hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
