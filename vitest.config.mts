import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // .tsx też — inaczej testy komponentów (np. dokumentów PDF) byłyby
    // po cichu pomijane: vitest zgłasza "no test files found" tylko przy
    // uruchomieniu z filtrem, a w pełnym przebiegu po prostu ich nie widzi.
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // import.meta.dirname zamiast __dirname — plik jest ESM (.mts),
    // a __dirname istnieje tylko w CommonJS.
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
