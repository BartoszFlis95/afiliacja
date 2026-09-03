/**
 * Kanoniczny adres serwisu — jedno źródło prawdy.
 *
 * Był powielony w sitemap.ts, robots.ts, layout.tsx (metadataBase) i jako
 * fallback w resend.ts. W tym ostatnim miejscu ZDĄŻYŁ SIĘ ROZJECHAĆ: wszędzie
 * indziej "https://www.deneeu.pl", tam "https://deneeu.pl" bez www.
 *
 * To nie jest kosmetyka. getAppUrl() buduje linki weryfikacji e-maila i resetu
 * hasła, a te niosą jednorazowy token w query stringu. Jeśli przekierowanie
 * apex -> www nie zachowuje query stringa, taki link cicho traci token i
 * użytkownik dostaje komunikat o nieprawidłowym linku, nie wiedząc dlaczego.
 */
export const CANONICAL_URL = "https://www.deneeu.pl";
