"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

interface UseCurrentUserResult {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const user: CurrentUser | null =
    isAuthenticated &&
    session?.user?.id &&
    session?.user?.email &&
    session?.user?.role
      ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role as Role,
        }
      : null;

  return { user, isLoading, isAuthenticated };
}
