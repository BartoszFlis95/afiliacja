import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col bg-[#1E1E2C] p-10 text-white relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5 z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold">Deneeu</span>
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight mb-4">
            Platforma Affiliate Marketing dla profesjonalistów
          </h2>
          <p className="text-white/60 leading-relaxed text-sm">
            Zarządzaj kampaniami, generuj linki afiliacyjne i śledź
            konwersje w czasie rzeczywistym.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-6">
            {[
              { value: "500+",  label: "Marek" },
              { value: "10K+",  label: "Influencerów" },
              { value: "2M+",   label: "Kliknięć/mies." },
              { value: "98%",   label: "Satysfakcji" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-sm text-white/50 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          © {new Date().getFullYear()} Deneeu. Wszelkie prawa zastrzeżone.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Deneeu</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
