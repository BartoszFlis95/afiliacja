import type { Metadata } from "next";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Polityka prywatności Deneeu — jakie dane zbieramy, w jakim celu je przetwarzamy, jakich plików cookie używamy oraz jakie prawa przysługują użytkownikom zgodnie z RODO.",
};

const SECTIONS = [
  {
    title: "1. Administrator danych",
    paragraphs: [
      "Administratorem danych osobowych przetwarzanych w związku z korzystaniem z platformy Deneeu (www.deneeu.pl) jest Deneeu Sp. z o.o. z siedzibą w Warszawie (ul. Przykładowa 1, 00-001 Warszawa), NIP: 0000000000 (dalej: „Administrator” lub „Deneeu”).",
      "W sprawach dotyczących ochrony danych osobowych można kontaktować się z Administratorem pod adresem e-mail kontakt@deneeu.pl.",
    ],
  },
  {
    title: "2. Jakie dane zbieramy",
    paragraphs: [
      "W zależności od roli w Platformie (Marka lub Influencer) zbieramy: dane rejestracyjne (adres e-mail, hasło w formie zahaszowanej), dane profilowe (nazwa firmy, NIP, adres, branża, strona www — dla Marek; nazwa wyświetlana, opis, linki do social media, liczba obserwujących — dla Influencerów).",
      "Dla celów wypłat i rozliczeń przetwarzamy dodatkowo: numer rachunku bankowego (IBAN), adres e-mail PayPal oraz identyfikator konta Stripe Connect (jeśli Influencer wybierze taką metodę wypłaty).",
      "Zbieramy również dane techniczne generowane automatycznie podczas korzystania z Platformy: adres IP, user-agent przeglądarki, adres referującej strony oraz dane o kliknięciach i konwersjach zarejestrowanych w ramach linków afiliacyjnych.",
    ],
  },
  {
    title: "3. Cel przetwarzania",
    paragraphs: [
      "Dane przetwarzane są w celu: świadczenia usług Platformy (rejestracja konta, generowanie linków afiliacyjnych, śledzenie konwersji), naliczania i realizacji wypłat prowizji, wystawiania dokumentów księgowych (faktur i rachunków), obsługi zgłoszeń i komunikacji z użytkownikiem oraz zapewnienia bezpieczeństwa i rozliczalności działań w Platformie (przeciwdziałanie nadużyciom).",
    ],
  },
  {
    title: "4. Podstawa prawna (RODO)",
    paragraphs: [
      "Dane przetwarzane są na podstawie: art. 6 ust. 1 lit. b RODO — w celu zawarcia i wykonania umowy o świadczenie usług drogą elektroniczną (założenie i prowadzenie konta, naliczanie i wypłata prowizji); art. 6 ust. 1 lit. c RODO — w celu wypełnienia obowiązków prawnych ciążących na Administratorze, w tym obowiązków podatkowo-księgowych związanych z wystawianiem faktur; art. 6 ust. 1 lit. f RODO — w celach wynikających z prawnie uzasadnionych interesów Administratora, takich jak zapewnienie bezpieczeństwa Platformy i dochodzenie roszczeń.",
    ],
  },
  {
    title: "5. Cookies",
    paragraphs: [
      "Platforma wykorzystuje pliki cookie niezbędne do prawidłowego działania mechanizmu śledzenia linków afiliacyjnych:",
    ],
    list: [
      "deneeu_ref — przechowuje identyfikator influencera powiązanego z kliknięciem w link afiliacyjny; ważność: 30 dni.",
      "deneeu_link_code — przechowuje kod konkretnego linku afiliacyjnego, z którego pochodzi ruch; ważność: 30 dni.",
    ],
    paragraphsAfter: [
      "Cookies te ustawiane są w momencie kliknięcia w link afiliacyjny (/r/kod) i pozwalają prawidłowo przypisać późniejszą konwersję (sprzedaż) do influencera, który ją wygenerował. Nie są wykorzystywane do celów reklamowych ani profilowania poza opisanym mechanizmem rozliczeniowym.",
      "Użytkownik może zarządzać plikami cookie w ustawieniach swojej przeglądarki, w tym je zablokować lub usunąć — może to jednak uniemożliwić prawidłowe naliczenie prowizji za dokonany zakup.",
    ],
  },
  {
    title: "6. Udostępnianie danych",
    paragraphs: [
      "Dane osobowe mogą być udostępniane zaufanym podmiotom przetwarzającym dane w imieniu Administratora, wyłącznie w zakresie niezbędnym do świadczenia usług Platformy:",
    ],
    list: [
      "Stripe — obsługa wypłat prowizji (Stripe Connect) oraz przetwarzanie danych rozliczeniowych.",
      "Resend — wysyłka wiadomości e-mail (powiadomienia o komisjach, wypłatach, zmianach statusu).",
      "Vercel — hosting aplikacji i infrastruktura uruchomieniowa.",
      "Neon — hostowana baza danych PostgreSQL, w której przechowywane są dane Platformy.",
      "Cloudflare R2 — przechowywanie plików graficznych (np. zdjęć produktów, logotypów marek).",
    ],
    paragraphsAfter: [
      "Wszystkie wskazane podmioty przetwarzają dane na podstawie odpowiednich umów powierzenia przetwarzania danych i wyłącznie zgodnie z instrukcjami Administratora. Dane nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych.",
    ],
  },
  {
    title: "7. Prawa użytkownika",
    paragraphs: [
      "Zgodnie z RODO użytkownikowi przysługuje prawo do: dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie Administratora.",
      "Użytkownikowi przysługuje również prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, jeśli uzna, że przetwarzanie jego danych narusza przepisy RODO.",
      "W celu realizacji powyższych praw prosimy o kontakt na adres kontakt@deneeu.pl.",
    ],
  },
  {
    title: "8. Kontakt",
    paragraphs: [
      "W sprawach dotyczących niniejszej polityki prywatności oraz przetwarzania danych osobowych można kontaktować się z Administratorem pod adresem e-mail kontakt@deneeu.pl lub pisemnie na adres siedziby: Deneeu Sp. z o.o., ul. Przykładowa 1, 00-001 Warszawa.",
    ],
  },
  {
    title: "9. Zmiany polityki",
    paragraphs: [
      "Administrator zastrzega sobie prawo do zmiany niniejszej polityki prywatności, w szczególności w związku ze zmianą przepisów prawa, zakresu przetwarzanych danych lub wykorzystywanych podmiotów przetwarzających.",
      "O istotnych zmianach polityki użytkownicy zostaną poinformowani drogą elektroniczną lub poprzez komunikat w Platformie, z odpowiednim wyprzedzeniem przed wejściem zmian w życie.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#EFF6FF]">
      <Navbar />

      <main className="pt-24 sm:pt-28 lg:pt-32">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-black text-[#0F172A] sm:text-4xl">
              Polityka prywatności Deneeu
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ostatnia aktualizacja: 9 lipca 2026
            </p>

            <div className="mt-10 space-y-10">
              {SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} className="text-base leading-relaxed text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                    {section.list && (
                      <ul className="ml-5 list-disc space-y-1.5">
                        {section.list.map((item) => (
                          <li key={item} className="text-base leading-relaxed text-slate-600">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.paragraphsAfter?.map((paragraph, i) => (
                      <p key={i} className="text-base leading-relaxed text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-10 border-t border-blue-100 pt-6 text-sm text-slate-500">
              Pytania dotyczące przetwarzania danych prosimy kierować na adres{" "}
              <a href="mailto:kontakt@deneeu.pl" className="text-blue-600 hover:underline">
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
