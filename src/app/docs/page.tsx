import type { Metadata } from "next";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Dokumentacja API — Deneeu",
  description:
    "Dokumentacja webhooków Deneeu: autentykacja, endpointy /api/track i /api/conversion, kody błędów oraz przykłady integracji w PHP, JavaScript, Python i cURL.",
};

const TOC = [
  { href: "#wprowadzenie", label: "Wprowadzenie" },
  { href: "#szybki-start", label: "Szybki start" },
  { href: "#autentykacja", label: "Autentykacja" },
  { href: "#api-track", label: "POST /api/track" },
  { href: "#api-conversion", label: "POST /api/conversion" },
  { href: "#kody-bledow", label: "Kody błędów" },
  { href: "#przyklady", label: "Przykłady integracji" },
  { href: "#cookies", label: "Śledzenie linków (cookies)" },
  { href: "#checklist", label: "Checklist testowania" },
];

const TRACK_FIELDS = [
  {
    field: "code",
    type: "string",
    required: "wymagane",
    description: "Kod unikalnego linku afiliacyjnego (AffiliateLink.code).",
  },
  {
    field: "orderValue",
    type: "number",
    required: "wymagane",
    description: "Wartość zamówienia. Musi być liczbą dodatnią.",
  },
  {
    field: "orderId",
    type: "string",
    required: "opcjonalne",
    description:
      "Twój identyfikator zamówienia. Używany do ochrony przed duplikatami (sprawdzany w obrębie Twojej marki).",
  },
];

const CONVERSION_FIELDS = [
  {
    field: "orderId",
    type: "string",
    required: "wymagane",
    description:
      "Twój identyfikator zamówienia. Używany globalnie do ochrony przed duplikatami.",
  },
  {
    field: "amount",
    type: "number",
    required: "wymagane",
    description: "Wartość zamówienia (musi być różna od zera).",
  },
  {
    field: "ref",
    type: "string",
    required: "wymagane",
    description:
      "Identyfikator influencera (InfluencerProfile.id) przypisany do konwersji.",
  },
  {
    field: "currency",
    type: "string",
    required: "opcjonalne",
    description:
      "Kod waluty, domyślnie \"PLN\". Zwracany w odpowiedzi, nie jest zapisywany w bazie danych.",
  },
  {
    field: "email",
    type: "string",
    required: "opcjonalne",
    description: "Adres e-mail klienta — zapisywany jako dane konwersji.",
  },
  {
    field: "productSlug",
    type: "string",
    required: "opcjonalne",
    description:
      "Slug produktu — pozwala rozróżnić linki, jeśli influencer promuje kilka produktów Twojej marki.",
  },
];

const ERROR_CODES = [
  {
    code: "400",
    when: "Nieprawidłowy JSON lub brak wymaganych pól w treści żądania.",
  },
  {
    code: "401",
    when:
      "Brak nagłówka x-api-key, nieprawidłowy klucz API lub niezgodny podpis HMAC (x-signature).",
  },
  {
    code: "403",
    when:
      "Link afiliacyjny należy do innej marki niż ta uwierzytelniona kluczem API (dotyczy /api/track).",
  },
  {
    code: "404",
    when: "Nie znaleziono linku afiliacyjnego dla podanego code / ref.",
  },
  {
    code: "409",
    when: "Zamówienie o podanym orderId zostało już zarejestrowane.",
  },
  {
    code: "500",
    when: "Wewnętrzny błąd serwera podczas przetwarzania żądania.",
  },
];

const CHECKLIST = [
  "Skopiuj swój x-api-key z panelu marki (Ustawienia → Integracja).",
  "Kliknij testowy link afiliacyjny (/r/kod) i odczytaj parametr ?ref= dołączony do przekierowania.",
  "Wyślij testowe żądanie POST /api/conversion z unikalnym orderId i poprawnym ref.",
  "Sprawdź, czy odpowiedź zwraca \"success\": true oraz poprawny breakdown prowizji.",
  "Wyślij dokładnie to samo żądanie ponownie i potwierdź, że otrzymujesz błąd 409.",
  "Sprawdź w panelu marki i influencera, czy konwersja pojawiła się ze statusem PENDING.",
  "Wyślij żądanie bez pola ref (lub amount / orderId) i potwierdź odpowiedź 400.",
  "Opcjonalnie: włącz podpis x-signature (HMAC-SHA256) i sprawdź, że nieprawidłowy podpis zwraca 401.",
];

export default function DocsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />

      <main className="pt-24 sm:pt-28 lg:pt-32">
        {/* Header */}
        <section className="bg-gradient-to-br from-[#EFF6FF] via-white to-[#DBEAFE] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              📚 Dokumentacja dla marek
            </span>
            <h1 className="mt-6 text-3xl font-black text-[#0F172A] sm:text-4xl lg:text-5xl">
              Dokumentacja API webhooków
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 sm:text-lg">
              Zintegruj swój sklep z Deneeu, aby automatycznie zgłaszać
              konwersje i naliczać prowizje influencerom w czasie
              rzeczywistym.
            </p>
          </div>

          <nav className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
            {TOC.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </section>

        <div className="mx-auto max-w-4xl space-y-16 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {/* Wprowadzenie */}
          <section id="wprowadzenie" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Wprowadzenie do webhooków
            </h2>
            <div className="mt-4 space-y-4 text-base text-slate-600">
              <p>
                Deneeu śledzi konwersje w modelu CPS (Cost Per Sale) —
                płacisz wyłącznie za zarejestrowane sprzedaże. Aby to
                działało, Twój sklep musi po każdym udanym zamówieniu wysłać
                żądanie <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">POST</code>{" "}
                do naszego API z danymi zamówienia i identyfikatorem
                influencera.
              </p>
              <p>
                Udostępniamy dwa endpointy webhookowe:{" "}
                <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">
                  /api/conversion
                </code>{" "}
                — rekomendowany endpoint bazujący na identyfikatorze
                influencera (<code className="font-mono">ref</code>), oraz{" "}
                <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">
                  /api/track
                </code>{" "}
                — alternatywny endpoint bazujący bezpośrednio na kodzie
                linku afiliacyjnego (<code className="font-mono">code</code>
                ). Oba tworzą prowizję ze statusem{" "}
                <code className="font-mono">PENDING</code>, którą marka
                zatwierdza w panelu.
              </p>
            </div>
          </section>

          {/* Szybki start */}
          <section id="szybki-start" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Szybki start
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Najszybszy sposób na sprawdzenie integracji to wysłanie
              żądania cURL bezpośrednio z terminala:
            </p>
            <div className="mt-4">
              <CodeBlock
                language="bash"
                code={`curl -X POST https://www.deneeu.pl/api/conversion \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: TWOJ_API_KEY" \\
  -d '{
    "orderId": "zamowienie-123",
    "amount": 299.99,
    "ref": "id_influencera",
    "email": "klient@example.com"
  }'`}
              />
            </div>
            <p className="mt-4 text-base text-slate-600">
              W odpowiedzi otrzymasz potwierdzenie zarejestrowania konwersji
              wraz z rozbiciem prowizji:
            </p>
            <div className="mt-4">
              <CodeBlock
                language="json"
                code={`{
  "success": true,
  "message": "Conversion registered",
  "breakdown": {
    "orderAmount": 299.99,
    "totalCommission": 44.99,
    "influencerCommission": 37.49,
    "platformCommission": 7.5,
    "currency": "PLN"
  }
}`}
              />
            </div>
          </section>

          {/* Autentykacja */}
          <section id="autentykacja" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Autentykacja
            </h2>
            <div className="mt-4 space-y-4 text-base text-slate-600">
              <p>
                Każde żądanie musi zawierać nagłówek{" "}
                <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">
                  x-api-key
                </code>{" "}
                z Twoim kluczem API. Klucz znajdziesz w panelu marki, w
                sekcji Ustawienia → Integracja.
              </p>
              <CodeBlock
                language="http"
                code={`POST /api/conversion HTTP/1.1
Host: www.deneeu.pl
Content-Type: application/json
x-api-key: TWOJ_API_KEY`}
              />
              <p>
                Opcjonalnie możesz dodatkowo podpisać treść żądania, aby
                zabezpieczyć się przed jego modyfikacją w tranzycie. Oblicz{" "}
                <code className="font-mono">HMAC-SHA256</code> z surowej
                treści żądania (JSON), używając swojego{" "}
                <code className="font-mono">webhookSecret</code>, i prześlij
                wynik jako nagłówek{" "}
                <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">
                  x-signature
                </code>
                . Podpis jest weryfikowany tylko wtedy, gdy nagłówek zostanie
                wysłany — jego brak nie blokuje żądania, ale zalecamy jego
                używanie w środowisku produkcyjnym.
              </p>
            </div>
          </section>

          {/* Endpoint /api/track */}
          <section id="api-track" className="scroll-mt-24">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                POST
              </span>
              <h2 className="font-mono text-xl font-black text-[#0F172A] sm:text-2xl">
                /api/track
              </h2>
            </div>
            <p className="mt-4 text-base text-slate-600">
              Rejestruje konwersję na podstawie kodu linku afiliacyjnego (
              <code className="font-mono">code</code>). Link musi należeć do
              produktu Twojej marki, w przeciwnym razie żądanie zostanie
              odrzucone.
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#EFF6FF] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pole</th>
                    <th className="px-4 py-3 font-semibold">Typ</th>
                    <th className="px-4 py-3 font-semibold">Wymagane</th>
                    <th className="px-4 py-3 font-semibold">Opis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {TRACK_FIELDS.map((row) => (
                    <tr key={row.field}>
                      <td className="px-4 py-3 font-mono text-blue-700">
                        {row.field}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.type}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.required}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm font-semibold text-slate-700">
              Przykładowe żądanie
            </p>
            <div className="mt-2">
              <CodeBlock
                language="json"
                code={`{
  "code": "abc123",
  "orderValue": 199.0,
  "orderId": "zamowienie-124"
}`}
              />
            </div>

            <p className="mt-6 text-sm font-semibold text-slate-700">
              Odpowiedź 200 OK
            </p>
            <div className="mt-2">
              <CodeBlock
                language="json"
                code={`{
  "success": true,
  "commissionId": "cmn_...",
  "commissionAmount": 29.85,
  "breakdown": {
    "orderAmount": 199.0,
    "totalCommission": 39.8,
    "influencerCommission": 29.85,
    "platformCommission": 9.95
  }
}`}
              />
            </div>
          </section>

          {/* Endpoint /api/conversion */}
          <section id="api-conversion" className="scroll-mt-24">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                POST
              </span>
              <h2 className="font-mono text-xl font-black text-[#0F172A] sm:text-2xl">
                /api/conversion
              </h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Rekomendowany
              </span>
            </div>
            <p className="mt-4 text-base text-slate-600">
              Rejestruje konwersję na podstawie identyfikatora influencera (
              <code className="font-mono">ref</code>). To domyślny endpoint
              prezentowany w panelu marki i zalecany dla większości
              integracji sklepowych.
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#EFF6FF] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pole</th>
                    <th className="px-4 py-3 font-semibold">Typ</th>
                    <th className="px-4 py-3 font-semibold">Wymagane</th>
                    <th className="px-4 py-3 font-semibold">Opis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {CONVERSION_FIELDS.map((row) => (
                    <tr key={row.field}>
                      <td className="px-4 py-3 font-mono text-blue-700">
                        {row.field}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.type}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.required}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm font-semibold text-slate-700">
              Przykładowe żądanie
            </p>
            <div className="mt-2">
              <CodeBlock
                language="json"
                code={`{
  "orderId": "zamowienie-123",
  "amount": 299.99,
  "ref": "id_influencera",
  "currency": "PLN",
  "email": "klient@example.com",
  "productSlug": "twoj-produkt"
}`}
              />
            </div>

            <p className="mt-6 text-sm font-semibold text-slate-700">
              Odpowiedź 200 OK
            </p>
            <div className="mt-2">
              <CodeBlock
                language="json"
                code={`{
  "success": true,
  "message": "Conversion registered",
  "breakdown": {
    "orderAmount": 299.99,
    "totalCommission": 44.99,
    "influencerCommission": 37.49,
    "platformCommission": 7.5,
    "currency": "PLN"
  }
}`}
              />
            </div>
          </section>

          {/* Kody błędów */}
          <section id="kody-bledow" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Kody błędów
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Oba endpointy zwracają błędy w formacie{" "}
              <code className="font-mono">{`{ "error": "..." }`}</code> wraz
              z odpowiednim kodem HTTP.
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-[#EFF6FF] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kod</th>
                    <th className="px-4 py-3 font-semibold">
                      Kiedy występuje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {ERROR_CODES.map((row) => (
                    <tr key={row.code}>
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        {row.code}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.when}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Przykłady integracji */}
          <section id="przyklady" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Przykłady integracji
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Poniżej znajdziesz gotowe fragmenty kodu do wysłania webhooka
              po zakończeniu zamówienia — dla WooCommerce, Node.js/JavaScript,
              Pythona oraz cURL.
            </p>

            <div className="mt-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  WooCommerce (PHP)
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Zapisz identyfikator influencera z parametru{" "}
                  <code className="font-mono">?ref=</code> w ciasteczku
                  Twojego sklepu, a następnie wyślij webhook po zakończeniu
                  zamówienia.
                </p>
                <div className="mt-3">
                  <CodeBlock
                    language="php"
                    code={`<?php
// 1) Zapisz ref przy wejściu z linku afiliacyjnego
add_action('init', function () {
    if (!empty($_GET['ref'])) {
        setcookie('deneeu_ref', sanitize_text_field($_GET['ref']), time() + 30 * DAY_IN_SECONDS, '/');
    }
});

// 2) Zgłoś konwersję po opłaceniu zamówienia
add_action('woocommerce_order_status_completed', function ($order_id) {
    $order = wc_get_order($order_id);
    if (!$order || empty($_COOKIE['deneeu_ref'])) {
        return;
    }

    $payload = wp_json_encode([
        'orderId' => (string) $order_id,
        'amount'  => (float) $order->get_total(),
        'ref'     => sanitize_text_field($_COOKIE['deneeu_ref']),
        'email'   => $order->get_billing_email(),
    ]);

    $signature = hash_hmac('sha256', $payload, 'TWOJ_WEBHOOK_SECRET');

    wp_remote_post('https://www.deneeu.pl/api/conversion', [
        'headers' => [
            'Content-Type' => 'application/json',
            'x-api-key'    => 'TWOJ_API_KEY',
            'x-signature'  => $signature,
        ],
        'body'    => $payload,
        'timeout' => 10,
    ]);
});`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  JavaScript / Node.js
                </h3>
                <div className="mt-3">
                  <CodeBlock
                    language="javascript"
                    code={`const crypto = require("crypto");

async function reportConversion({ orderId, amount, ref, email }) {
  const payload = JSON.stringify({ orderId, amount, ref, email });
  const signature = crypto
    .createHmac("sha256", process.env.DENEEU_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const response = await fetch("https://www.deneeu.pl/api/conversion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.DENEEU_API_KEY,
      "x-signature": signature,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(\`Deneeu webhook error: \${response.status}\`);
  }

  return response.json();
}`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Python</h3>
                <div className="mt-3">
                  <CodeBlock
                    language="python"
                    code={`import hashlib
import hmac
import json
import requests

API_KEY = "TWOJ_API_KEY"
WEBHOOK_SECRET = "TWOJ_WEBHOOK_SECRET"

def report_conversion(order_id: str, amount: float, ref: str, email: str | None = None) -> dict:
    payload = json.dumps({
        "orderId": order_id,
        "amount": amount,
        "ref": ref,
        "email": email,
    })
    signature = hmac.new(WEBHOOK_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()

    response = requests.post(
        "https://www.deneeu.pl/api/conversion",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "x-signature": signature,
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">cURL</h3>
                <div className="mt-3">
                  <CodeBlock
                    language="bash"
                    code={`curl -X POST https://www.deneeu.pl/api/conversion \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: TWOJ_API_KEY" \\
  -H "x-signature: OBLICZONY_HMAC_SHA256" \\
  -d '{
    "orderId": "zamowienie-123",
    "amount": 299.99,
    "ref": "id_influencera",
    "email": "klient@example.com"
  }'`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section id="cookies" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Śledzenie linków (cookies)
            </h2>
            <div className="mt-4 space-y-4 text-base text-slate-600">
              <p>
                Kiedy odwiedzający kliknie link afiliacyjny (
                <code className="font-mono">/r/kod</code>), Deneeu zapisuje
                dwa ciasteczka ważne przez{" "}
                <strong className="text-[#0F172A]">30 dni</strong>:
              </p>
              <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-[#EFF6FF] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ciasteczko</th>
                      <th className="px-4 py-3 font-semibold">Wartość</th>
                      <th className="px-4 py-3 font-semibold">
                        Wykorzystanie
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    <tr>
                      <td className="px-4 py-3 font-mono text-blue-700">
                        deneeu_ref
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        ID influencera
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        Wartość wysyłana jako pole <code>ref</code> do{" "}
                        <code>/api/conversion</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-blue-700">
                        deneeu_link_code
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        Kod linku afiliacyjnego
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        Zapisywany dla celów analitycznych — nie jest
                        wymagany do rejestracji konwersji.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Przekierowanie z <code className="font-mono">/r/kod</code>{" "}
                dołącza do adresu docelowego również parametry query:{" "}
                <code className="font-mono">?ref=...&amp;utm_source=deneeu&amp;utm_medium=affiliate&amp;utm_campaign=kod</code>
                .
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <strong>Ważne:</strong> ciasteczka Deneeu są ustawiane w
                domenie deneeu.pl i nie będą widoczne z poziomu Twojego
                sklepu (inna domena). Zalecamy odczytanie identyfikatora{" "}
                <code className="font-mono">ref</code> z parametru query przy
                pierwszym wejściu i zapisanie go we własnym ciasteczku lub
                sesji sklepu, tak jak w przykładzie WooCommerce powyżej.
              </div>
            </div>
          </section>

          {/* Checklist */}
          <section id="checklist" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
              Checklist testowania
            </h2>
            <ul className="mt-4 space-y-3">
              {CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-blue-100 bg-white p-4 text-sm text-slate-600 shadow-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
