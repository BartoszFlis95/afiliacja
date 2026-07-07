"use server";

import { after } from "next/server";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";
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
      // Brak osobnego flow do weryfikacji maila — rejestracja jest równoznaczna
      // z potwierdzeniem, inaczej authorize() w lib/auth.ts nigdy nie wpuści
      // tego użytkownika (wymaga emailVerified).
      emailVerified: new Date(),
    },
  });

  // Nie blokuj rejestracji na wysyłce maila — fire-and-forget, ale zaplanowane
  // przez after() tak, żeby dokończyło się nawet po zamrożeniu funkcji serverless.
  const displayName = email.split("@")[0];
  after(() =>
    sendEmail({
      to: email,
      subject: "Witaj w Deneeu! 🎉",
      react: WelcomeEmail({ name: displayName, role: role as "BRAND" | "INFLUENCER" }),
    }).catch((err) => console.error("[email] welcome failed:", err))
  );

  let redirectTo = "/influencer/dashboard";
  if (role === "BRAND") redirectTo = "/brand/dashboard";

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    // Patrz loginAction: Auth.js v5 czasem rzuca NEXT_REDIRECT mimo redirect:false
    // (edge case Next.js 16) — konto i sesja i tak powstały, więc to sukces.
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      return { success: true, redirectTo };
    }
    return {
      success: false,
      error: "Konto utworzone, ale logowanie nie powiodło się. Zaloguj się ręcznie.",
    };
  }

  return { success: true, redirectTo };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
