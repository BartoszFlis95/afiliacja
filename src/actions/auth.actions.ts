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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    // auth() cannot read the new session in the same server action request,
    // so we read the role directly from the DB to build the redirect URL.
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true },
    });
    let redirectTo = "/influencer/dashboard";
    if (user?.role === "ADMIN") redirectTo = "/admin/dashboard";
    if (user?.role === "BRAND") redirectTo = "/brand/dashboard";

    return { success: true, redirectTo };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Nieprawidłowy email lub hasło" };
        default:
          return { success: false, error: "Wystąpił błąd podczas logowania" };
      }
    }
    return { success: false, error: "Wystąpił nieoczekiwany błąd" };
  }
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
