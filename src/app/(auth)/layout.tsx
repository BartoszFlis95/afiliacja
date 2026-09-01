import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col bg-[#0F172A] p-10 text-white relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

        <Link href="/" className="relative flex items-center z-10">
          <Image
            src="/logo.png"
            alt="Deneeu"
            width={1600}
            height={903}
            sizes="150px"
            className="h-8 w-auto rounded-lg object-contain"
            priority
          />
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
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
        <div className="w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-8 shadow-xl">
          <Link href="/" className="mb-8 flex justify-center lg:hidden">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Deneeu"
                width={1600}
                height={903}
                sizes="(min-width: 640px) 320px, 260px"
                className="h-14 w-auto rounded-xl object-contain sm:h-[72px]"
                priority
              />
              {/* Delikatny cień "pod spodem" logo, nie zwykły box-shadow */}
              <div className="absolute inset-x-8 -bottom-2 h-3 rounded-full bg-primary/20 blur-md" />
            </div>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
