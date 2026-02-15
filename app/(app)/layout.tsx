import { SidebarProvider } from "../../components/Sidebar";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import AppSidebar from "@/components/layout/Sidebar";
import { getSidebarQuotaResetLabel } from "@/features/auth/services/sidebarService";

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
        <div className="flex-1 p-8">{children}</div>
      </div>
    </SidebarProvider>
  );
}
