import type { Metadata } from "next";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Polityka prywatności Deneeu — jakie dane zbieramy, cel przetwarzania (RODO art. 6), pliki cookie, udostępnianie danych podwykonawcom oraz prawa użytkownika.",
};

const SECTIONS = [
  {
    title: "1. Jakie dane zbieramy",
    paragraphs: [
      "Podczas rejestracji i korzystania z Platformy zbieramy w szczególności: adres e-mail oraz hasło (przechowywane w formie zahaszowanej), numer rachunku bankowego (IBAN) i dane do wypłat podawane przez influencerów, adres IP oraz dane techniczne przeglądarki, a także informacje zapisywane w plikach cookie wykorzystywanych do śledzenia linków afiliacyjnych.",
    ],
  },
  {
    title: "2. Cel przetwarzania (RODO art. 6)",
    paragraphs: [
      "Dane przetwarzamy na podstawie: art. 6 ust. 1 lit. b RODO — w celu zawarcia i wykonania umowy o świadczenie usług drogą elektroniczną (założenie konta, naliczanie i wypłata prowizji); art. 6 ust. 1 lit. c RODO — w celu wypełnienia obowiązków prawnych, w tym podatkowo-księgowych związanych z wystawianiem faktur; art. 6 ust. 1 lit. f RODO — w celach wynikających z prawnie uzasadnionego interesu administratora, takich jak zapewnienie bezpieczeństwa Platformy i przeciwdziałanie nadużyciom.",
    ],
  },
  {
    title: "3. Cookies",
    paragraphs: [
      "Platforma wykorzystuje pliki cookie niezbędne do prawidłowego działania mechanizmu śledzenia linków afiliacyjnych:",
    ],
    list: [
      "deneeu_ref — przechowuje identyfikator influencera powiązanego z kliknięciem w link afiliacyjny; ważność: 30 dni.",
      "deneeu_link_code — przechowuje kod konkretnego linku afiliacyjnego, z którego pochodzi ruch; ważność: 30 dni.",
    ],
  },
  {
    title: "4. Udostępnianie danych",
    paragraphs: [
      "Dane osobowe mogą być udostępniane zaufanym podmiotom przetwarzającym dane w imieniu administratora, wyłącznie w zakresie niezbędnym do świadczenia usług Platformy:",
    ],
    list: [
      "Stripe — obsługa wypłat prowizji (Stripe Connect) oraz przetwarzanie danych rozliczeniowych.",
      "Resend — wysyłka wiadomości e-mail (powiadomienia o komisjach, wypłatach, zmianach statusu).",
      "Vercel — hosting aplikacji i infrastruktura uruchomieniowa.",
      "Neon — hostowana baza danych PostgreSQL, w której przechowywane są dane Platformy.",
      "Cloudflare R2 — przechowywanie plików graficznych (np. zdjęć produktów, logotypów marek).",
    ],
  },
  {
    title: "5. Prawa użytkownika",
    paragraphs: [
      "Zgodnie z RODO użytkownikowi przysługuje prawo do: dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania oraz przenoszenia danych do innego administratora, a także prawo wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie administratora.",
      "Użytkownikowi przysługuje również prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, jeśli uzna, że przetwarzanie jego danych narusza przepisy RODO.",
    ],
  },
  {
    title: "6. Kontakt",
    paragraphs: [
      "W celu realizacji powyższych praw lub w innych sprawach dotyczących przetwarzania danych osobowych prosimy o kontakt na adres kontakt@deneeu.pl.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-primary/10">
      <Navbar />

      <main id="main" tabIndex={-1} className="pt-24 sm:pt-28 lg:pt-32">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">
              Polityka prywatności Deneeu
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ostatnia aktualizacja: 9 lipca 2026
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Administratorem danych osobowych przetwarzanych w związku z
              korzystaniem z platformy Deneeu jest Deneeu Sp. z o.o. z
              siedzibą w Warszawie.
            </p>

            <div className="mt-10 space-y-10">
              {SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-bold text-foreground">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} className="text-base leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                    {section.list && (
                      <ul className="ml-5 list-disc space-y-1.5">
                        {section.list.map((item) => (
                          <li key={item} className="text-base leading-relaxed text-muted-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-10 border-t border-primary/20 pt-6 text-sm text-muted-foreground">
              Pytania dotyczące przetwarzania danych prosimy kierować na adres{" "}
              <a href="mailto:kontakt@deneeu.pl" className="text-primary hover:underline">
                kontakt@deneeu.pl
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
