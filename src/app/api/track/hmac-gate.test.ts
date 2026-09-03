import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyHmacSignature } from "@/lib/hmac";

/**
 * Bramka podpisu w /api/track jest w fazie przejściowej: podpis jest
 * WERYFIKOWANY gdy przyjdzie, ale jego brak jeszcze nie blokuje — inaczej
 * wymuszenie zepsułoby każdą działającą integrację marki.
 *
 * Ten test opisuje kontrakt tej bramki, żeby przy przestawianiu
 * WYMAGAJ_PODPISU na true było widać, co dokładnie się zmienia.
 */
const SECRET = "sekret-marki";
const BODY = JSON.stringify({ code: "abc123", orderValue: 199.99, orderId: "ORD-1" });

function bramka(signature: string | null, wymagaj: boolean) {
  if (signature) {
    return verifyHmacSignature(BODY, signature, SECRET) ? "przepusc" : "odrzuc";
  }
  return wymagaj ? "odrzuc" : "przepusc-z-ostrzezeniem";
}

describe("bramka podpisu w /api/track", () => {
  const dobry = crypto.createHmac("sha256", SECRET).update(BODY).digest("hex");

  it("w fazie przejściowej przepuszcza brak podpisu (stare integracje)", () => {
    expect(bramka(null, false)).toBe("przepusc-z-ostrzezeniem");
  });

  it("ale ZŁY podpis odrzuca już teraz", () => {
    expect(bramka(dobry.slice(0, -2) + "00", false)).toBe("odrzuc");
  });

  it("poprawny podpis przechodzi niezależnie od fazy", () => {
    expect(bramka(dobry, false)).toBe("przepusc");
    expect(bramka(dobry, true)).toBe("przepusc");
  });

  it("po wymuszeniu brak podpisu zaczyna być odrzucany", () => {
    expect(bramka(null, true)).toBe("odrzuc");
  });
});
