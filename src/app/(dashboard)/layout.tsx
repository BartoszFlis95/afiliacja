export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";

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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar role={role} email={email} />
      <SidebarInset className="min-w-0">
        <DashboardHeader role={role} email={email} />
        <main className="min-w-0 flex-1 bg-background p-4 pb-24 sm:p-6 md:pb-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          <div className="w-full min-w-0">
            {children}
          </div>
        </main>
        <MobileBottomNav role={role} />
      </SidebarInset>
    </SidebarProvider>
  );
}
