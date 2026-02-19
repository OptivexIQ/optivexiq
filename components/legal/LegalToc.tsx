"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type LegalTocItem = {
  id: string;
  label: string;
};

type LegalTocProps = {
  title: string;
  items: LegalTocItem[];
  className?: string;
};

export function LegalToc({ title, items, className }: LegalTocProps) {
  const [activeHash, setActiveHash] = useState<string>("");

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(window.location.hash);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <nav
      aria-label={title}
      className={`rounded-xl border border-border/60 bg-card/70 p-4 ${className ?? ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const href = `#${item.id}`;
          const isActive = activeHash === href;

          return (
            <li key={item.id}>
              <Link
                href={href}
                aria-current={isActive ? "location" : undefined}
                className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
