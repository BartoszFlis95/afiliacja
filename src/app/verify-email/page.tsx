import Link from "next/link";

import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] p-8">
      <div className="w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-8 shadow-xl">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-[#0F172A]">Deneeu</span>
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        </Link>
        <VerifyEmailClient token={token} email={email} />
      </div>
    </div>
  );
}
