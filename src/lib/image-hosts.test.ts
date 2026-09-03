import { describe, expect, it } from "vitest";
import { dozwolonyUrlObrazu, remotePatterns, DOZWOLONE_HOSTY } from "./image-hosts";

describe("dozwolonyUrlObrazu", () => {
  it("przyjmuje hosty z listy po https", () => {
    expect(dozwolonyUrlObrazu("https://lh3.googleusercontent.com/a/b.png")).toBe(true);
    expect(dozwolonyUrlObrazu("https://avatars.githubusercontent.com/u/1")).toBe(true);
    expect(
      dozwolonyUrlObrazu("https://pub-0047fe05b86f46949b2dab328b219e47.r2.dev/x.jpg"),
    ).toBe(true);
  });

  it("obsługuje wzorzec *.r2.dev, ale nie samą domenę bazową", () => {
    expect(dozwolonyUrlObrazu("https://cokolwiek.r2.dev/x.jpg")).toBe(true);
    // "*.r2.dev" wymaga etykiety z przodu — samo r2.dev nie jest naszym bucketem
    expect(dozwolonyUrlObrazu("https://r2.dev/x.jpg")).toBe(false);
  });

  it("odrzuca podszywanie się pod dozwolony host", () => {
    expect(dozwolonyUrlObrazu("https://r2.dev.atakujacy.example/x.jpg")).toBe(false);
    expect(dozwolonyUrlObrazu("https://lh3.googleusercontent.com.zly.example/a")).toBe(false);
    // "nie-r2.dev" kończy się na "-r2.dev", nie na ".r2.dev" — to inna domena
    expect(dozwolonyUrlObrazu("https://nie-r2.dev/x.jpg")).toBe(false);
  });

  it("odrzuca protokoły inne niż https", () => {
    expect(dozwolonyUrlObrazu("http://cokolwiek.r2.dev/x.jpg")).toBe(false);
    expect(dozwolonyUrlObrazu("javascript:alert(1)")).toBe(false);
    expect(dozwolonyUrlObrazu("data:image/svg+xml,<svg onload=alert(1)>")).toBe(false);
  });

  it("odrzuca śmieci i adresy bez limitu długości", () => {
    expect(dozwolonyUrlObrazu("")).toBe(false);
    expect(dozwolonyUrlObrazu("nie-url")).toBe(false);
    expect(dozwolonyUrlObrazu("https://cokolwiek.r2.dev/" + "a".repeat(2100))).toBe(false);
  });

  it("remotePatterns odwzorowuje listę 1:1 i wymusza https", () => {
    expect(remotePatterns).toHaveLength(DOZWOLONE_HOSTY.length);
    expect(remotePatterns.every((p) => p.protocol === "https")).toBe(true);
  });
});
