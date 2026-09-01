export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { CommandPalette } from "@/components/shared/CommandPalette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role ?? "INFLUENCER";
  const email = session.user.email ?? "";

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ "--sidebar-width": "280px" } as React.CSSProperties}
    >
      <AppSidebar role={role} email={email} />
      <CommandPalette role={role} />
      <SidebarInset className="min-w-0">
        <DashboardHeader role={role} email={email} />
        <main className="min-w-0 flex-1 bg-background p-4 md:p-6 lg:p-8">
          <div className="w-full min-w-0">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
