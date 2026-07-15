import Image from "next/image";
import Link from "next/link";

const FOOTER_COLUMNS: {
  title: string;
  links: { href: string; label: string }[];
}[] = [
  {
    title: "Platforma",
    links: [
      { href: "#jak-to-dziala", label: "Jak to działa" },
      { href: "#korzysci", label: "Korzyści" },
      { href: "#dla-kogo", label: "Dla marek" },
      { href: "#dla-kogo", label: "Dla influencerów" },
      { href: "/docs", label: "Dokumentacja API" },
    ],
  },
  {
    title: "Firma",
    links: [
      { href: "/o-nas", label: "O nas" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/blog", label: "Blog (wkrótce)" },
    ],
  },
  {
    title: "Prawne",
    links: [
      { href: "/terms", label: "Regulamin" },
      { href: "/privacy", label: "Polityka prywatności" },
      { href: "/docs", label: "Dokumentacja API" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0F172A]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Deneeu"
                width={40}
                height={40}
                className="object-contain rounded-lg"
                priority
              />
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xl font-black text-white">Deneeu</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              Platforma affiliate marketing CPS łącząca marki z
              influencerami.
            </p>
            <p className="mt-4 text-sm text-slate-400">kontakt@deneeu.pl</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-2 border-t border-slate-800 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Deneeu. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-sm text-slate-700">
            Projekt polskiej afiliacji CPS
          </p>
        </div>
      </div>
    </footer>
  );
}
