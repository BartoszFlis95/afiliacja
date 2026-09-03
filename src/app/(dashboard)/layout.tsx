export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WERSJA_REGULAMINU } from "@/lib/legal";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  /**
   * Bramka akceptacji regulaminu.
   *
   * Stoi tutaj, a nie w middleware, bo middleware widzi wyłącznie token JWT.
   * Data akceptacji zapisana w tokenie byłaby nieaktualna zaraz po jej
   * zapisaniu, a projekt nie używa useSession, którym dałoby się token
   * odświeżyć — użytkownik wracałby na stronę akceptacji w nieskończoność.
   * Layout czyta stan z bazy przy każdym żądaniu, więc nie da się go ominąć
   * ani zawiesić: obejmuje wszystkie trasy /admin, /brand i /influencer.
   */
  if (session.user.id) {
    const zgody = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tosAcceptedAt: true, privacyAcceptedAt: true, tosVersion: true },
    });

    const aktualne =
      zgody?.tosAcceptedAt &&
      zgody.privacyAcceptedAt &&
      zgody.tosVersion === WERSJA_REGULAMINU;

    if (!aktualne) {
      redirect("/accept-terms");
    }
  }

  const role = session.user.role ?? "INFLUENCER";
  const email = session.user.email ?? "";

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        style={{ "--sidebar-width": "280px" } as React.CSSProperties}
      >
        <AppSidebar role={role} email={email} />
        <CommandPalette role={role} />
        <SidebarInset className="min-w-0">
          <DashboardHeader role={role} email={email} />
          <main
            id="main"
            tabIndex={-1}
            className="min-w-0 flex-1 bg-background p-4 md:p-6 lg:p-8"
          >
            <div className="w-full min-w-0">{children}</div>
          </main>
        </SidebarInset>
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
  );
}
