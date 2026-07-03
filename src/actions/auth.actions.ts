"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Verify credentials manually first so we know the role for the redirect
  // URL and can treat any NEXT_REDIRECT from signIn() as a definite success.
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { role: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  let redirectTo = "/influencer/dashboard";
  if (user.role === "ADMIN") redirectTo = "/admin/dashboard";
  if (user.role === "BRAND") redirectTo = "/brand/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    // Auth.js v5 sometimes throws NEXT_REDIRECT even with redirect:false
    // (Next.js 16 edge case). Credentials are already verified above,
    // so any NEXT_REDIRECT means the session was created — treat as success.
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      return { success: true, redirectTo };
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Wystąpił błąd podczas logowania" };
    }
    throw error;
  }

  return { success: true, redirectTo };
}

export async function registerAction(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Użytkownik z tym emailem już istnieje" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: role as Role,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    let redirectTo = "/influencer/dashboard";
    if (role === "BRAND") redirectTo = "/brand/dashboard";
    return { success: true, redirectTo };
  } catch {
    return {
      success: false,
      error: "Konto utworzone, ale logowanie nie powiodło się. Zaloguj się ręcznie.",
    };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
