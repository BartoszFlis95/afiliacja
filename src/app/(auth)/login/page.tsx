import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Zaloguj się</h1>
      <LoginForm />
    </div>
  );
}
