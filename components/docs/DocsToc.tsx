"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type DocsTocItem = {
  id: string;
  label: string;
};

type DocsTocProps = {
  title: string;
  items: DocsTocItem[];
  className?: string;
};

export function DocsToc({ title, items, className }: DocsTocProps) {
  const [activeHash, setActiveHash] = useState<string>("");

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <nav
      aria-label={title}
      className={`border-r border-border/70 pr-5 ${className ?? ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const href = `#${item.id}`;
          const isActive = activeHash === href;

          return (
            <li key={item.id}>
              <Link
                href={href}
                aria-current={isActive ? "location" : undefined}
                className={`block text-base transition-colors ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
