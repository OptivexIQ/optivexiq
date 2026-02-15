import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardNavbarMenu from "@/components/layout/DashboardNavbarMenu";
import { SidebarToggle } from "../Sidebar";
import { getNavbarDataSafe } from "@/features/auth/services/navbarService";

const progressVariantMap = {
  normal: "info",
  warning: "warning",
  danger: "critical",
} as const;

export default async function DashboardNavbar() {
  const navbarData = await getNavbarDataSafe();
  const progressVariant = navbarData
    ? progressVariantMap[navbarData.progressVariant]
    : progressVariantMap.normal;
  const planLabel = navbarData?.planLabel ?? "Plan unavailable";
  const statusLabel = navbarData?.statusLabel ?? "Status unavailable";
  const statusVariant = navbarData?.statusVariant ?? "secondary";
  const usageText = navbarData?.usageText ?? "Usage unavailable";
  const usagePercent = navbarData?.usagePercent ?? null;
  const userInitials = navbarData?.userInitials ?? "";
  const workspaceName = navbarData?.workspaceName ?? "";
  const headline = workspaceName ? `${workspaceName} Dashboard` : "Dashboard";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Executive workspace
          </p>
          <p className="text-lg font-semibold text-foreground">{headline}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{planLabel}</Badge>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <div className="hidden min-w-45 flex-col gap-1 text-xs text-muted-foreground sm:flex">
          <div className="flex items-center justify-between">
            <span>Usage</span>
            <span>{usageText}</span>
          </div>
          {usagePercent !== null && (
            <Progress
              value={usagePercent}
              variant={progressVariant}
              className="h-1.5"
            />
          )}
        </div>
        <DashboardNavbarMenu userInitials={userInitials} />
      </div>
    </header>
  );
}
