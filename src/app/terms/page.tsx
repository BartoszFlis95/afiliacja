import type { Metadata } from "next";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Regulamin",
  description:
    "Regulamin platformy Deneeu — zasady rejestracji, korzystania z platformy CPS, naliczania prowizji, wypłat i faktur dla marek i influencerów.",
};

const SECTIONS = [
  {
    title: "1. Postanowienia ogólne",
    paragraphs: [
      "Niniejszy regulamin określa zasady korzystania z platformy Deneeu (dalej: „Platforma”), dostępnej pod adresem www.deneeu.pl, prowadzonej przez Deneeu Sp. z o.o. z siedzibą w Warszawie (ul. Przykładowa 1, 00-001 Warszawa), NIP: 0000000000 (dalej: „Deneeu” lub „Operator”).",
      "Platforma umożliwia markom (dalej: „Marki”) i influencerom (dalej: „Influencerzy”) nawiązywanie współpracy w modelu marketingu afiliacyjnego rozliczanego w modelu CPS (Cost Per Sale), w tym generowanie linków afiliacyjnych, śledzenie konwersji oraz naliczanie i wypłatę prowizji.",
      "Korzystanie z Platformy oznacza akceptację niniejszego regulaminu w całości. Użytkownik, który nie akceptuje regulaminu, powinien zaprzestać korzystania z Platformy.",
    ],
  },
  {
    title: "2. Rejestracja",
    paragraphs: [
      "Korzystanie z pełnej funkcjonalności Platformy wymaga założenia konta i wyboru roli: Marka albo Influencer. Rejestracja jest bezpłatna.",
      "Podczas rejestracji użytkownik zobowiązany jest podać prawdziwe, aktualne i kompletne dane. Marki uzupełniają dane firmy (w tym dane do faktur), a Influencerzy — dane profilu oraz, opcjonalnie, dane do wypłat.",
      "Deneeu zastrzega sobie prawo do weryfikacji konta oraz odmowy rejestracji lub zawieszenia konta w przypadku podania nieprawdziwych danych lub naruszenia regulaminu.",
    ],
  },
  {
    title: "3. Zasady korzystania",
    paragraphs: [
      "Marki dodają produkty wraz z ustaloną stawką prowizji oraz linkiem do sklepu, a Influencerzy generują unikalne linki afiliacyjne do promowania tych produktów.",
      "Zabronione jest generowanie sztucznego ruchu, fałszowanie kliknięć lub konwersji, korzystanie z Platformy niezgodnie z jej przeznaczeniem oraz naruszanie praw osób trzecich, w tym praw autorskich i dóbr osobistych.",
      "Deneeu może zawiesić lub usunąć konto użytkownika naruszającego regulamin, po uprzednim wezwaniu do zaprzestania naruszeń, chyba że naruszenie jest rażące — wówczas zawieszenie może nastąpić natychmiastowo.",
    ],
  },
  {
    title: "4. Prowizje i wypłaty",
    paragraphs: [
      "Prowizja naliczana jest automatycznie na podstawie zarejestrowanej konwersji (sprzedaży) i stawki procentowej ustalonej przez Markę dla danego produktu. Prowizja dzielona jest pomiędzy Influencera oraz Operatora zgodnie ze stawkami widocznymi w panelu Marki przy tworzeniu produktu.",
      "Prowizja otrzymuje status „Oczekująca”, a następnie jest zatwierdzana lub odrzucana przez Markę. Wypłacie podlegają wyłącznie prowizje zatwierdzone.",
      "Influencer może zlecić wypłatę zatwierdzonej prowizji po osiągnięciu minimalnego progu wypłaty ustawionego w panelu. Wypłaty realizowane są przelewem na wskazany rachunek bankowy (IBAN) lub za pośrednictwem Stripe Connect / PayPal, w zależności od wybranej metody.",
      "Deneeu dokłada starań, aby wypłaty realizowane były niezwłocznie, nie później jednak niż w terminie 14 dni roboczych od momentu zatwierdzenia wniosku o wypłatę.",
    ],
  },
  {
    title: "5. Faktury",
    paragraphs: [
      "Za usługi świadczone na rzecz Marek Deneeu wystawia faktury VAT zgodnie z obowiązującymi przepisami, na podstawie danych podanych przez Markę w panelu.",
      "Influencerzy rozliczają się z Deneeu zgodnie z wybraną formą rozliczeń (np. rachunek, faktura), a dokumenty rozliczeniowe dostępne są do pobrania w panelu Influencera po zrealizowaniu wypłaty.",
      "Odpowiedzialność za prawidłowość danych podatkowych podanych na potrzeby wystawienia dokumentów rozliczeniowych spoczywa na użytkowniku, który te dane podał.",
    ],
  },
  {
    title: "6. Odpowiedzialność",
    paragraphs: [
      "Deneeu pełni rolę pośrednika technologicznego pomiędzy Markami a Influencerami i nie ponosi odpowiedzialności za treść materiałów promocyjnych tworzonych przez Influencerów ani za jakość, dostępność lub zgodność z prawem produktów oferowanych przez Marki.",
      "Deneeu dokłada należytej staranności, aby Platforma działała nieprzerwanie i bezbłędnie, jednak nie gwarantuje nieprzerwanego dostępu do Platformy i nie odpowiada za przerwy wynikające z przyczyn technicznych, w tym awarii dostawców usług infrastrukturalnych.",
      "Odpowiedzialność Deneeu wobec użytkowników ogranicza się do rzeczywiście poniesionej straty i nie obejmuje utraconych korzyści, w zakresie dopuszczalnym przez obowiązujące przepisy prawa.",
    ],
  },
  {
    title: "7. Zakończenie współpracy",
    paragraphs: [
      "Użytkownik może w każdej chwili zrezygnować z korzystania z Platformy i zażądać usunięcia konta, kontaktując się z Deneeu pod adresem kontakt@deneeu.pl.",
      "Usunięcie konta nie wpływa na prawa i obowiązki stron powstałe przed usunięciem, w szczególności na obowiązek rozliczenia zatwierdzonych, a jeszcze niewypłaconych prowizji.",
      "Deneeu może wypowiedzieć umowę o świadczenie usług drogą elektroniczną w przypadku rażącego lub uporczywego naruszania regulaminu przez użytkownika, z zachowaniem 14-dniowego okresu wypowiedzenia, chyba że charakter naruszenia uzasadnia natychmiastowe zakończenie współpracy.",
    ],
  },
  {
    title: "8. Zmiany regulaminu",
    paragraphs: [
      "Deneeu zastrzega sobie prawo do zmiany regulaminu z ważnych przyczyn, w tym zmian przepisów prawa, zmian w funkcjonalności Platformy lub zmian modelu rozliczeń.",
      "O zmianach regulaminu użytkownicy zostaną poinformowani drogą elektroniczną, z co najmniej 14-dniowym wyprzedzeniem przed wejściem zmian w życie. Dalsze korzystanie z Platformy po tym terminie oznacza akceptację zmienionego regulaminu.",
    ],
  },
  {
    title: "9. Postanowienia końcowe",
    paragraphs: [
      "W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.",
      "Ewentualne spory wynikłe w związku z korzystaniem z Platformy strony będą starały się rozwiązać polubownie, a w przypadku braku porozumienia — właściwy będzie sąd powszechny zgodnie z obowiązującymi przepisami.",
      "Regulamin wchodzi w życie z dniem publikacji na stronie Platformy.",
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
