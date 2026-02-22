"use client";

import Link from "next/link";
import Image from "next/image";
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
          <Link href="/" className="flex items-center">
            {collapsed ? (
              <Image
                src="/optivexiq_icon_logo.png"
                alt="OptivexIQ"
                width={32}
                height={32}
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 100vw"
                quality={100}
                className="h-8 w-8"
              />
            ) : (
              <Image
                src="/optivex_white_logo.png"
                alt="OptivexIQ"
                width={132}
                height={32}
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 100vw"
                quality={100}
                className="h-8 w-auto"
                priority
              />
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
