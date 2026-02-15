"use client";

import React from "react";
import Link from "next/link";
import { PanelLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const SIDEBAR_COOKIE = "sidebar:collapsed";
const SIDEBAR_WIDTH = 256; // 16rem
const SIDEBAR_COLLAPSED_WIDTH = 64; // icon-only
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/* -------------------------------------------------------------------------- */
/*                                   CONTEXT                                  */
/* -------------------------------------------------------------------------- */

type SidebarContextType = {
  collapsed: boolean;
  toggle: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("Sidebar components must be used within SidebarProvider");
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                              SIDEBAR PROVIDER                              */
/* -------------------------------------------------------------------------- */

type SidebarProviderProps = {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
};

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Load persisted state
  React.useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith(SIDEBAR_COOKIE));
    if (saved) {
      setCollapsed(saved.split("=")[1] === "true");
    }
  }, []);

  const toggle = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }

    setCollapsed((prev) => {
      document.cookie = `${SIDEBAR_COOKIE}=${!prev}; path=/; max-age=${
        60 * 60 * 24 * 30
      }`;
      return !prev;
    });
  }, [isMobile]);

  // Keyboard shortcut (cmd/ctrl + b)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === SIDEBAR_KEYBOARD_SHORTCUT) {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle, isMobile, mobileOpen, setMobileOpen }}
    >
      <div className="flex min-h-screen w-full bg-background">{children}</div>
    </SidebarContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   SIDEBAR                                  */
/* -------------------------------------------------------------------------- */

type SidebarProps = {
  children: React.ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  const { collapsed, isMobile, mobileOpen, setMobileOpen } = useSidebar();

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {children}
        </aside>
      </>
    );
  }

  return (
    <>
      {/* Fixed Sidebar */}
      <aside
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200"
      >
        {children}
      </aside>

      {/* Spacer to offset main content */}
      <div
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
        className="shrink-0 transition-all duration-200"
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SIDEBAR HEADER                               */
/* -------------------------------------------------------------------------- */

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-4">{children}</div>;
}

/* -------------------------------------------------------------------------- */
/*                               SIDEBAR SECTION                              */
/* -------------------------------------------------------------------------- */

type SidebarSectionProps = {
  title?: string;
  children: React.ReactNode;
};

export function SidebarSection({ title, children }: SidebarSectionProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="px-3 py-2">
      {title && !collapsed && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SIDEBAR ITEM                                */
/* -------------------------------------------------------------------------- */

type SidebarItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  hidden?: boolean;
};

export function SidebarItem({
  href,
  icon,
  label,
  active,
  badge,
  hidden,
}: SidebarItemProps) {
  const { collapsed } = useSidebar();

  if (hidden) return null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      {!collapsed && <span className="truncate">{label}</span>}

      {!collapsed && badge !== undefined && (
        <span className="ml-auto rounded-md bg-sidebar-accent px-2 py-0.5 text-xs font-medium">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SIDEBAR FOOTER                               */
/* -------------------------------------------------------------------------- */

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto p-3">{children}</div>;
}

/* -------------------------------------------------------------------------- */
/*                              SIDEBAR TOGGLE BTN                            */
/* -------------------------------------------------------------------------- */

export function SidebarToggle() {
  const { toggle } = useSidebar();
  const { collapsed } = useSidebar();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle Sidebar"
      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
    >
      {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
    </button>
  );
}
