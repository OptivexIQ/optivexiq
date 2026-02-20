import { getSidebarQuotaResetLabel } from "@/features/auth/services/sidebarService";
import { SidebarProvider } from "../../components/Sidebar";
import AppSidebar from "@/components/layout/Sidebar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardNavbar from "@/components/layout/DashboardNavbar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const quotaResetLabelPromise = getSidebarQuotaResetLabel();

  return (
    <SidebarProvider>
      <AppSidebar quotaResetLabel={await quotaResetLabelPromise} />
      <div className="flex flex-1 flex-col">
        <DashboardNavbar />
        <div className="flex flex-1 flex-col p-8">
          <div className="flex-1">{children}</div>
        </div>
        <DashboardFooter />
      </div>
    </SidebarProvider>
  );
}
