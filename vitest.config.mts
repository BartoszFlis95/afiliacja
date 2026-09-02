import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // import.meta.dirname zamiast __dirname — plik jest ESM (.mts),
    // a __dirname istnieje tylko w CommonJS.
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
