"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Gauge,
  Settings,
  Sliders,
  UserSquare2,
  Wand2,
} from "lucide-react";

import {
  Sidebar,
  SidebarHeader,
  SidebarSection,
  SidebarItem,
  SidebarFooter,
  useSidebar,
} from "@/components/Sidebar";
import { FeedbackQuickModal } from "@/features/feedback/components/FeedbackQuickModal";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: Gauge },
  {
    label: "Conversion Gap Engine",
    href: "/dashboard/gap-engine",
    icon: BarChart3,
  },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Rewrite Studio", href: "/dashboard/rewrites", icon: Wand2 },
  { label: "SaaS Profile", href: "/dashboard/profile", icon: UserSquare2 },
  { label: "Billing", href: "/dashboard/billing", icon: Sliders },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

type AppSidebarProps = {
  quotaResetLabel: string;
};

export default function AppSidebar({ quotaResetLabel }: AppSidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar>
      {/* ---------------- HEADER ---------------- */}
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-primary-foreground"
              >
                <path
                  d="M2 4L8 2L14 4L8 6L2 4Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M2 4V10L8 12V6L2 4Z"
                  fill="currentColor"
                  opacity="0.6"
                />
                <path d="M8 6V12L14 10V4L8 6Z" fill="currentColor" />
              </svg>
            </div>

            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-sidebar-foreground">
                  OptivexIQ
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Revenue intelligence
                </span>
              </div>
            )}
          </Link>
        </div>
      </SidebarHeader>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-sidebar-border" />

      {/* ---------------- NAVIGATION ---------------- */}
      <SidebarSection title="Dashboard">
        {navigation.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={<item.icon size={18} />}
            label={item.label}
            active={isActive(item.href)}
          />
        ))}
      </SidebarSection>

      {/* ---------------- FOOTER ---------------- */}
      <SidebarFooter>
        {!collapsed ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/70">
              {quotaResetLabel}
            </div>
            <FeedbackQuickModal />
          </div>
        ) : (
          <div className="flex justify-center">
            <FeedbackQuickModal compact />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
