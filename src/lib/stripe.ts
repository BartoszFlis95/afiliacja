import Stripe from "stripe";

// Stripe rzuca wyjątek w konstruktorze, jeśli klucz jest pusty — a moduł jest
// importowany podczas builda (zbieranie danych stron), więc brak klucza w
// środowisku (np. lokalnie przed skonfigurowaniem Stripe) nie może wywalać builda.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_missing_key", {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});
