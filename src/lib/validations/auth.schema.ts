import { z } from "zod";
import { Role } from "@prisma/client";

export const LoginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const RegisterSchema = z
  .object({
    email: z.string().email("Nieprawidłowy adres email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
    role: z.enum([Role.BRAND, Role.INFLUENCER], {
      errorMap: () => ({ message: "Wybierz rolę: BRAND lub INFLUENCER" }),
    }),
    // Wymagany tylko dla marek — rejestracja influencerów zostaje otwarta.
    // Admin generuje kody i wysyła linki markom (patrz admin.actions.ts).
    inviteCode: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== Role.BRAND || !!data.inviteCode, {
    message: "Kod zaproszenia jest wymagany dla kont typu Marka",
    path: ["inviteCode"],
  });

export const PasswordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
  .regex(/[0-9]/, "Hasło musi zawierać cyfrę");

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

export const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type RegisterSchemaType = z.infer<typeof RegisterSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof ResetPasswordSchema>;
