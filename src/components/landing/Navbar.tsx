"use client";

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
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="text-xl font-black text-[#0F172A]">Deneeu</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600"
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Otwórz menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col">
            <SheetHeader>
              <SheetTitle className="text-left normal-case tracking-normal">
                <span className="flex items-center gap-2 font-black text-[#0F172A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  Deneeu
                </span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 p-8">
              <Button asChild variant="outline" onClick={() => setOpen(false)}>
                <Link href="/login">Zaloguj się</Link>
              </Button>
              <Button asChild onClick={() => setOpen(false)}>
                <Link href="/register">Zacznij teraz</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
