import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { DashboardHeader } from "@/components/shared/DashboardHeader";

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
      <SidebarInset>
        <DashboardHeader role={role} email={email} />
        <main className="flex-1 bg-background p-4 md:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
