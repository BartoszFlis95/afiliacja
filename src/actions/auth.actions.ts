"use server";

import { after } from "next/server";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppUrl } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";
import VerifyEmailEmail from "@/emails/VerifyEmailEmail";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

type LoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string; code?: string; email?: string };

async function sendVerificationEmail(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: crypto.randomUUID(),
      expires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  const verifyUrl = `${getAppUrl()}/verify-email?token=${verificationToken.token}`;
  const displayName = email.split("@")[0];

  after(() =>
    sendEmail({
      to: email,
      subject: "Potwierdź swój email w Deneeu",
      react: VerifyEmailEmail({ name: displayName, verifyUrl }),
    }).catch((err) => console.error("[email] verify failed:", err))
  );
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
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
    select: { role: true, passwordHash: true, emailVerified: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Nieprawidłowy email lub hasło" };
  }

  if (!user.emailVerified) {
    return {
      success: false,
      error: "Potwierdź swój email przed logowaniem.",
      code: "EMAIL_NOT_VERIFIED",
      email: parsed.data.email.toLowerCase(),
    };
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
    // Defense in depth: authorize() in lib/auth.ts also throws this if
    // emailVerified is missing — normally caught by the pre-check above,
    // but kept here in case authorize() is ever reached directly.
    if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
      return {
        success: false,
        error: "Potwierdź swój email przed logowaniem.",
        code: "EMAIL_NOT_VERIFIED",
        email: parsed.data.email.toLowerCase(),
      };
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

  const email = parsed.data.email.toLowerCase();
  const { password, role } = parsed.data;

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
      // emailVerified zostaje null do czasu kliknięcia linku z maila —
      // authorize() w lib/auth.ts odrzuci logowanie do tego momentu.
    },
  });

  await sendVerificationEmail(email);

  return {
    success: true,
    redirectTo: `/verify-email?email=${encodeURIComponent(email)}`,
  };
}

export async function verifyEmailAction(
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: "Brak tokena weryfikacyjnego." };
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return {
      success: false,
      error: "Nieprawidłowy lub już wykorzystany link weryfikacyjny.",
    };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { success: false, error: "Link weryfikacyjny wygasł. Wyślij go ponownie." };
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  });

  if (!user) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { success: false, error: "Nie znaleziono konta powiązanego z tym linkiem." };
  }

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  // Mail powitalny wysyłamy dopiero teraz — konto jest już realnie aktywne.
  if (user.role !== "ADMIN") {
    const displayName = user.email.split("@")[0];
    after(() =>
      sendEmail({
        to: user.email,
        subject: "Witaj w Deneeu! 🎉",
        react: WelcomeEmail({
          name: displayName,
          role: user.role as "BRAND" | "INFLUENCER",
        }),
      }).catch((err) => console.error("[email] welcome failed:", err))
    );
  }

  return { success: true };
}

export async function resendVerificationEmailAction(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail) {
    return { success: false, error: "Podaj adres email." };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { success: false, error: "Nie znaleziono konta z tym adresem email." };
  }
  if (user.emailVerified) {
    return { success: false, error: "Ten adres email jest już potwierdzony." };
  }

  await sendVerificationEmail(normalizedEmail);

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
