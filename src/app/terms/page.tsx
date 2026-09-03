import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  DATA_AKTUALIZACJI,
  OPLATA_PLATFORMY,
  TERMIN_PLATNOSCI_DNI,
  TERMIN_ZATWIERDZENIA_DNI,
  WERSJA_REGULAMINU,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Regulamin",
  description:
    "Regulamin platformy Deneeu — definicje, zasady działania, rejestracja, miesięczny cykl rozliczeniowy, obowiązki marek i influencerów, odpowiedzialność oraz rozwiązanie umowy.",
};

const PROCENT_PLATFORMY = `${Math.round(OPLATA_PLATFORMY * 100)}%`;

type Sekcja = {
  title: string;
  paragraphs: string[];
  list?: string[];
  paragraphsAfter?: string[];
};

const SECTIONS: Sekcja[] = [
  {
    title: "1. Definicje",
    paragraphs: [
      "Na potrzeby niniejszego regulaminu poniższe pojęcia oznaczają:",
    ],
    list: [
      "Platforma — serwis internetowy Deneeu, prowadzony przez Deneeu Sp. z o.o. z siedzibą w Warszawie, umożliwiający współpracę afiliacyjną w modelu CPS (Cost Per Sale).",
      "Marka — przedsiębiorca, który udostępnia na Platformie swoje produkty wraz ze stawką prowizji i rozlicza się z Platformą za zarejestrowaną sprzedaż.",
      "Influencer — osoba fizyczna lub przedsiębiorca, który promuje produkty Marek za pomocą wygenerowanych na Platformie linków afiliacyjnych i otrzymuje z tego tytułu prowizję.",
      "Konwersja — zarejestrowana sprzedaż produktu Marki dokonana za pośrednictwem linku afiliacyjnego Influencera.",
      "Okres rozliczeniowy — miesiąc kalendarzowy, za który Platforma wystawia Marce fakturę zbiorczą.",
    ],
  },
  {
    title: "2. Zasady działania platformy",
    paragraphs: [
      "Platforma umożliwia Markom i Influencerom nawiązywanie współpracy w modelu marketingu afiliacyjnego rozliczanego za sprzedaż — Marka ponosi koszt wyłącznie za zarejestrowaną Konwersję.",
      "Marka dodaje produkty wraz z ustaloną przez siebie stawką prowizji. Influencer generuje unikalny link afiliacyjny i promuje produkt. Kliknięcie w link jest rejestrowane, a zakup dokonany w jego następstwie tworzy Konwersję i naliczoną prowizję.",
      "Użytkownik zobowiązany jest korzystać z Platformy zgodnie z jej przeznaczeniem, obowiązującymi przepisami prawa oraz dobrymi obyczajami.",
    ],
  },
  {
    title: "3. Rejestracja i konto",
    paragraphs: [
      "Korzystanie z Platformy wymaga założenia konta, potwierdzenia adresu e-mail oraz akceptacji niniejszego regulaminu i polityki prywatności. Bez obu akceptacji konto nie zostanie utworzone.",
      "Użytkownik zobowiązany jest podać prawdziwe dane rejestracyjne i utrzymywać je w aktualności. Marka rozliczająca się jako przedsiębiorca podaje numer NIP — bez niego Platforma nie może wystawić prawidłowej faktury VAT.",
      "Konto jest przypisane do jednej roli: Marki albo Influencera. Użytkownik odpowiada za zachowanie poufności danych logowania i niezwłoczne zgłoszenie Platformie każdego przypadku nieuprawnionego dostępu.",
      `Platforma odnotowuje datę i wersję zaakceptowanych dokumentów. W przypadku istotnej zmiany regulaminu użytkownik zostanie poproszony o ponowną akceptację przy najbliższym logowaniu. Aktualna wersja regulaminu: ${WERSJA_REGULAMINU}.`,
    ],
  },
  {
    title: "4. Prowizje i rozliczenia",
    paragraphs: [
      "Stawkę prowizji ustala Marka odrębnie dla każdego produktu. Prowizja naliczana jest automatycznie od wartości zamówienia w chwili rejestracji Konwersji i otrzymuje status „Oczekująca”, a następnie jest zatwierdzana lub odrzucana przez Markę.",
      `Platforma pobiera opłatę w wysokości ${PROCENT_PLATFORMY} wartości prowizji należnej Influencerowi. Opłata doliczana jest do kwoty faktury wystawianej Marce i nie pomniejsza wynagrodzenia Influencera.`,
      "Rozliczenie odbywa się w cyklu miesięcznym. Prowizje zatwierdzone w danym Okresie rozliczeniowym są sumowane, a po jego zakończeniu Platforma wystawia Marce jedną fakturę zbiorczą obejmującą łączną kwotę prowizji powiększoną o opłatę Platformy.",
      `Termin płatności faktury wynosi ${TERMIN_PLATNOSCI_DNI} dni od daty jej wystawienia. Płatność następuje przelewem na rachunek bankowy wskazany na fakturze.`,
      "Wypłaty prowizji na rzecz Influencerów są odblokowywane po zaksięgowaniu wpłaty Marki za dany Okres rozliczeniowy. Do tego czasu prowizja pozostaje widoczna w panelu Influencera jako oczekująca, lecz nie podlega wypłacie. Zasada ta wynika z tego, że Platforma wypłaca Influencerom środki otrzymane uprzednio od Marki.",
      "Po odblokowaniu wypłaty Influencer może zlecić wypłatę zatwierdzonych prowizji po osiągnięciu minimalnego progu ustawionego w panelu. Wypłaty realizowane są przelewem na rachunek bankowy (IBAN) lub za pośrednictwem Stripe Connect albo PayPal, nie później niż w terminie 14 dni roboczych od zatwierdzenia wniosku.",
      "Wszystkie kwoty wyrażone są w złotych polskich (PLN). Do kwot netto doliczany jest podatek VAT według stawki obowiązującej w dniu wystawienia faktury.",
    ],
  },
  {
    title: "5. Obowiązki Marki",
    paragraphs: ["Marka zobowiązuje się w szczególności do:"],
    list: [
      "prawidłowej integracji swojego sklepu z Platformą, w tym poprawnego skonfigurowania mechanizmu zgłaszania Konwersji (webhook), oraz utrzymania tej integracji w działaniu,",
      `zatwierdzenia lub odrzucenia zarejestrowanej Konwersji w terminie ${TERMIN_ZATWIERDZENIA_DNI} dni od jej zgłoszenia; po bezskutecznym upływie tego terminu Platforma może zatwierdzić Konwersję samodzielnie,`,
      "terminowego regulowania faktur wystawionych przez Platformę za Okres rozliczeniowy,",
      "utrzymywania aktualnych i prawdziwych danych rozliczeniowych, w tym numeru NIP i adresu siedziby,",
      "rzetelnego opisywania produktów oraz niezwłocznego dezaktywowania ofert, które przestały być dostępne.",
    ],
    paragraphsAfter: [
      "Opóźnienie w płatności faktury wstrzymuje odblokowanie wypłat dla Influencerów promujących produkty danej Marki. Platforma może zawiesić widoczność produktów Marki do czasu uregulowania zaległości.",
    ],
  },
  {
    title: "6. Obowiązki Influencera",
    paragraphs: [
      "Influencer zobowiązuje się promować produkty uczciwie, zgodnie z prawem i dobrymi obyczajami, w tym oznaczać treści reklamowe zgodnie z obowiązującymi przepisami o ochronie konsumentów.",
      "Zabronione jest w szczególności:",
    ],
    list: [
      "tzw. self-click — klikanie we własne linki afiliacyjne lub zlecanie takich kliknięć w celu wygenerowania Konwersji na własną korzyść,",
      "zgłaszanie, generowanie lub wspomaganie fałszywych Konwersji niepopartych rzeczywistą sprzedażą,",
      "wykorzystywanie botów lub innych zautomatyzowanych narzędzi do generowania sztucznego ruchu lub Konwersji,",
      "spamowanie linkami afiliacyjnymi oraz ich rozpowszechnianie w sposób naruszający regulaminy serwisów trzecich,",
      "wprowadzanie odbiorców w błąd co do właściwości produktu, jego ceny lub warunków zakupu.",
    ],
    paragraphsAfter: [
      "Influencer zobowiązany jest podać i utrzymywać aktualne dane niezbędne do wypłaty — numer rachunku bankowego w formacie IBAN albo adres e-mail PayPal. Platforma nie ponosi odpowiedzialności za wypłatę zrealizowaną na podany przez Influencera nieprawidłowy rachunek.",
      "Naruszenie powyższych zakazów skutkuje wstrzymaniem wypłaty powiązanych prowizji oraz może skutkować zawieszeniem lub usunięciem konta, niezależnie od innych roszczeń przysługujących Platformie.",
    ],
  },
  {
    title: "7. Odpowiedzialność",
    paragraphs: [
      "Platforma pełni rolę pośrednika technicznego i rozliczeniowego pomiędzy Marką a Influencerem. Platforma nie jest sprzedawcą produktów i nie odpowiada za ich jakość, zgodność z opisem, realizację zamówienia ani obsługę reklamacji — odpowiedzialność w tym zakresie ponosi wyłącznie Marka.",
      "Platforma dokłada starań, aby rejestracja kliknięć i Konwersji przebiegała prawidłowo, jednak nie ponosi odpowiedzialności za Konwersje niezarejestrowane wskutek okoliczności leżących po stronie Marki lub użytkownika końcowego, w szczególności wadliwej integracji sklepu, blokowania plików cookies lub oprogramowania blokującego skrypty.",
      "Platforma nie odpowiada za przerwy w działaniu serwisu wynikające z przyczyn od niej niezależnych ani za skutki działania siły wyższej. O planowanych przerwach technicznych użytkownicy będą informowani z wyprzedzeniem.",
      "Odpowiedzialność Platformy wobec użytkownika ograniczona jest do wysokości opłat pobranych przez Platformę od tego użytkownika w okresie trzech miesięcy poprzedzających zdarzenie będące źródłem szkody. Ograniczenie to nie dotyczy szkód wyrządzonych umyślnie ani przypadków, w których wyłączenie odpowiedzialności jest niedopuszczalne w świetle obowiązujących przepisów, w szczególności wobec konsumentów.",
    ],
  },
  {
    title: "8. Ochrona danych osobowych",
    paragraphs: [
      "Administratorem danych osobowych użytkowników jest Deneeu Sp. z o.o. Dane przetwarzane są w celu świadczenia usług Platformy, prowadzenia rozliczeń oraz wypełnienia obowiązków prawnych ciążących na Platformie, w szczególności podatkowych i księgowych.",
      "Szczegółowe zasady przetwarzania danych, informacje o plikach cookies oraz opis przysługujących praw znajdują się w polityce prywatności, stanowiącej integralną część niniejszego regulaminu.",
    ],
  },
  {
    title: "9. Rozwiązanie umowy",
    paragraphs: [
      "Użytkownik może w każdej chwili zrezygnować z korzystania z Platformy i zażądać usunięcia konta, kontaktując się z Platformą pod adresem kontakt@deneeu.pl.",
      "Usunięcie konta nie zwalnia z obowiązku rozliczenia zobowiązań powstałych przed jego usunięciem — w szczególności Marka pozostaje zobowiązana do opłacenia wystawionych faktur, a Influencerowi przysługuje wypłata prowizji zatwierdzonych i objętych opłaconą fakturą.",
      "Platforma może wypowiedzieć umowę o świadczenie usług drogą elektroniczną ze skutkiem natychmiastowym w przypadku rażącego lub uporczywego naruszania regulaminu, w tym naruszenia zakazów wskazanych w sekcji 6 lub zalegania z płatnościami wskazanymi w sekcji 5.",
      "Dane rozliczeniowe niezbędne do wypełnienia obowiązków podatkowych i księgowych przechowywane są po usunięciu konta przez okres wymagany przepisami prawa.",
    ],
  },
  {
    title: "10. Postanowienia końcowe",
    paragraphs: [
      "Platforma może zmienić niniejszy regulamin z ważnych przyczyn, w szczególności w razie zmiany przepisów prawa, zakresu świadczonych usług lub zasad rozliczeń. O zmianie użytkownicy zostaną poinformowani z co najmniej 14-dniowym wyprzedzeniem na podany adres e-mail.",
      "Zmiana regulaminu skutkuje podniesieniem jego wersji. Przy najbliższym logowaniu użytkownik zostanie poproszony o akceptację nowej wersji. Brak akceptacji uniemożliwia dalsze korzystanie z Platformy i jest równoznaczny z wypowiedzeniem umowy, co nie narusza rozliczeń już powstałych.",
      "W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.",
      "Ewentualne spory strony będą starały się rozwiązać polubownie. Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w tym z platformy ODR. W braku porozumienia spory rozstrzyga sąd właściwy według przepisów ogólnych.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-primary/10">
      <Navbar />

      <main id="main" tabIndex={-1} className="pt-24 sm:pt-28 lg:pt-32">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-black text-foreground sm:text-4xl">
              Regulamin platformy Deneeu
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Wersja {WERSJA_REGULAMINU} · ostatnia aktualizacja: {DATA_AKTUALIZACJI}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Operatorem platformy Deneeu jest Deneeu Sp. z o.o. z siedzibą w
              Warszawie. Poniższy regulamin określa zasady korzystania z
              platformy przez marki i influencerów.
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
                    {section.paragraphsAfter?.map((paragraph, i) => (
                      <p key={i} className="text-base leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-10 border-t border-primary/20 pt-6 text-sm text-muted-foreground">
              Integralną częścią regulaminu jest{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                polityka prywatności
              </Link>
              . Pytania dotyczące regulaminu prosimy kierować na adres{" "}
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
