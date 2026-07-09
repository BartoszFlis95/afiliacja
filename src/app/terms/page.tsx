import type { Metadata } from "next";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Regulamin",
  description:
    "Regulamin platformy Deneeu — zasady korzystania, prawa i obowiązki marek i influencerów, prowizje i wypłaty, zakazane działania oraz zasady rozwiązania umowy.",
};

const SECTIONS = [
  {
    title: "1. Zasady korzystania z platformy",
    paragraphs: [
      "Platforma Deneeu (dalej: „Platforma”) umożliwia markom i influencerom nawiązywanie współpracy w modelu marketingu afiliacyjnego rozliczanego w modelu CPS (Cost Per Sale) — marka płaci wyłącznie za zarejestrowaną sprzedaż.",
      "Korzystanie z Platformy wymaga założenia konta i akceptacji niniejszego regulaminu. Marki dodają produkty wraz z ustaloną stawką prowizji, a influencerzy generują unikalne linki afiliacyjne do ich promowania.",
      "Użytkownik zobowiązany jest korzystać z Platformy zgodnie z jej przeznaczeniem, obowiązującymi przepisami prawa oraz dobrymi obyczajami.",
    ],
  },
  {
    title: "2. Prawa i obowiązki marek i influencerów",
    paragraphs: [
      "Marka ma prawo do: ustalania stawki prowizji dla swoich produktów, zatwierdzania lub odrzucania zarejestrowanych konwersji oraz zarządzania współpracującymi influencerami. Marka zobowiązana jest do rzetelnego rozliczania zatwierdzonych prowizji oraz terminowego regulowania wystawionych faktur.",
      "Influencer ma prawo do: generowania linków afiliacyjnych do aktywnych produktów, wglądu w statystyki kliknięć i konwersji oraz zlecania wypłat zatwierdzonych prowizji po osiągnięciu minimalnego progu. Influencer zobowiązany jest promować produkty zgodnie z prawem i dobrymi obyczajami, w tym oznaczać treści reklamowe zgodnie z obowiązującymi przepisami.",
      "Obie strony zobowiązane są podawać prawdziwe dane rejestracyjne oraz niezwłocznie informować Deneeu o wszelkich nieprawidłowościach dotyczących konta lub rozliczeń.",
    ],
  },
  {
    title: "3. Prowizje i wypłaty",
    paragraphs: [
      "Prowizja naliczana jest automatycznie na podstawie zarejestrowanej konwersji i stawki procentowej ustalonej przez markę dla danego produktu. Nowa prowizja otrzymuje status „Oczekująca”, a następnie jest zatwierdzana lub odrzucana przez markę.",
      "Wypłacie podlegają wyłącznie prowizje zatwierdzone, po osiągnięciu minimalnego progu wypłaty ustawionego w panelu influencera. Wypłaty realizowane są przelewem na rachunek bankowy (IBAN) lub za pośrednictwem Stripe Connect / PayPal, nie później niż w terminie 14 dni roboczych od zatwierdzenia wniosku o wypłatę.",
    ],
  },
  {
    title: "4. Zakazane działania",
    paragraphs: [
      "W ramach korzystania z Platformy zabronione jest w szczególności:",
    ],
    list: [
      "spamowanie linkami afiliacyjnymi oraz ich rozpowszechnianie w sposób naruszający regulaminy serwisów trzecich,",
      "tzw. self-click — klikanie we własne linki afiliacyjne lub zlecanie takich kliknięć w celu wygenerowania konwersji na własną korzyść,",
      "zgłaszanie, generowanie lub wspomaganie fałszywych konwersji niepopartych rzeczywistą sprzedażą,",
      "wykorzystywanie botów lub innych zautomatyzowanych narzędzi do generowania sztucznego ruchu lub konwersji.",
    ],
    paragraphsAfter: [
      "Naruszenie powyższych zakazów skutkuje wstrzymaniem wypłaty powiązanych prowizji oraz może skutkować natychmiastowym zawieszeniem lub usunięciem konta, niezależnie od innych roszczeń przysługujących Deneeu.",
    ],
  },
  {
    title: "5. Rozwiązanie umowy",
    paragraphs: [
      "Użytkownik może w każdej chwili zrezygnować z korzystania z Platformy i zażądać usunięcia konta, kontaktując się z Deneeu pod adresem kontakt@deneeu.pl. Usunięcie konta nie zwalnia z obowiązku rozliczenia prowizji zatwierdzonych, a jeszcze niewypłaconych.",
      "Deneeu może wypowiedzieć umowę o świadczenie usług drogą elektroniczną ze skutkiem natychmiastowym w przypadku rażącego lub uporczywego naruszania regulaminu przez użytkownika, w tym naruszenia zakazów wskazanych w sekcji 4.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#EFF6FF]">
      <Navbar />

      <main className="pt-24 sm:pt-28 lg:pt-32">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-black text-[#0F172A] sm:text-4xl">
              Regulamin platformy Deneeu
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ostatnia aktualizacja: 9 lipca 2026
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Operatorem platformy Deneeu jest Deneeu Sp. z o.o. z siedzibą w
              Warszawie. Poniższy regulamin określa zasady korzystania z
              platformy przez marki i influencerów.
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
              Pytania dotyczące regulaminu prosimy kierować na adres{" "}
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
