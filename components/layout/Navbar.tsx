"use client";

import Link from "next/link";
import { createSupabaseBrowserClient } from "@/services/supabase/browser";
import { useMemo, useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/services/auth";
import { buildUserInitials } from "@/features/auth/utils/initials";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data?.user || null);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    window.location.reload();
  };
  const userInitials = buildUserInitials(user?.email);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
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
              <path d="M2 4V10L8 12V6L2 4Z" fill="currentColor" opacity="0.6" />
              <path d="M8 6V12L14 10V4L8 6Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            OptivexIQ
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "How It Works", href: "#solution" },
            { label: "Pricing", href: "#pricing" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.email || "User"}
                    />
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
                      {userInitials || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="#free-snapshot"
                className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-secondary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground"
          >
            {mobileOpen ? (
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/95 px-6 pb-6 pt-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            {[
              { label: "Features", href: "#features" },
              { label: "How It Works", href: "#solution" },
              { label: "Pricing", href: "#pricing" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-4">
              {loading ? null : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full focus:outline-none w-full flex justify-start">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={user.email || "User"}
                        />
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
                          {userInitials || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Log in
                  </Link>
                  <Link
                    href="#free-snapshot"
                    className="rounded-lg bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
