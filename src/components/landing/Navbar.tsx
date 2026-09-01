"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#jak-to-dziala", label: "Jak to działa" },
  { href: "#korzysci", label: "Korzyści" },
  { href: "#dla-kogo", label: "Dla marek" },
  { href: "#dla-kogo", label: "Dla influencerów" },
  { href: "/docs", label: "Dokumentacja" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          {/* h-10/w-10 na mobile, rośnie do docelowych 56x56 od sm: — inaczej
              logo nachodziłoby na przycisk menu w wąskim pasku h-16. */}
          <Image
            src="/logo.png"
            alt="Deneeu"
            width={56}
            height={56}
            unoptimized
            className="aspect-square h-10 w-10 rounded-xl object-contain shadow-sm sm:h-14 sm:w-14"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="outline">
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Zacznij teraz</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild size="sm" className="h-9 px-3 text-sm sm:h-10 sm:px-4">
            <Link href="/register">Zacznij teraz</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                aria-label="Otwórz menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-4/5 flex-col sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-left normal-case tracking-normal">
                  <Image
                    src="/logo.png"
                    alt="Deneeu"
                    width={40}
                    height={40}
                    unoptimized
                    className="aspect-square h-10 w-10 rounded-xl object-contain shadow-sm"
                  />
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-8">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-3 p-8">
                <Button
                  asChild
                  variant="outline"
                  className="h-12"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Zaloguj się</Link>
                </Button>
                <Button
                  asChild
                  className="h-12"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/register">Zacznij teraz</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
