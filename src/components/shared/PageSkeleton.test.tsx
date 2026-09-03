import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  CardGridSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "./PageSkeleton";

const policzBloki = (html: string) =>
  (html.match(/animate-pulse/g) ?? []).length;

describe("PageSkeleton", () => {
  it("neutralny wariant nie udaje konkretnego układu", () => {
    const html = renderToStaticMarkup(<PageSkeleton />);
    // nagłówek (2 bloki) + jeden blok treści — nic więcej
    expect(policzBloki(html)).toBe(3);
  });

  it("nagłówek ma tytuł i podtytuł", () => {
    expect(policzBloki(renderToStaticMarkup(<PageHeaderSkeleton />))).toBe(2);
  });

  it("tabela renderuje żądaną liczbę wierszy plus nagłówek", () => {
    expect(policzBloki(renderToStaticMarkup(<TableSkeleton rows={5} />))).toBe(6);
    expect(policzBloki(renderToStaticMarkup(<TableSkeleton />))).toBe(9);
  });

  it("siatka kart renderuje żądaną liczbę kart", () => {
    expect(policzBloki(renderToStaticMarkup(<CardGridSkeleton cards={3} />))).toBe(3);
  });

  it("formularz renderuje etykietę i pole na każde pole plus przycisk", () => {
    expect(policzBloki(renderToStaticMarkup(<FormSkeleton fields={4} />))).toBe(9);
  });

  it("używa tokenów motywu, nie kolorów na sztywno", () => {
    const html = renderToStaticMarkup(<TableSkeleton />);
    expect(html).toContain("bg-muted");
    expect(html).not.toMatch(/bg-(gray|slate|zinc)-\d/);
  });
});
