import { type DefaultSession } from "next-auth";
import { type Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Rozszerzenie obiektu User zwracanego przez providery/adapter
   * oraz przekazywanego do callbacków.
   */
  interface User {
    id: string;
    role: Role;
  }

  /**
   * Rozszerzenie sesji dostępnej po stronie klienta i serwera
   * (useSession, auth(), getServerSession).
   */
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Rozszerzenie tokenu JWT o id i rolę użytkownika. */
  interface JWT {
    id: string;
    role: Role;
  }
}
