import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const linkGroups = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "How It Works", href: "/#solution" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Free Conversion Audit", href: "/#free-snapshot" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Help Center", href: "/docs" },
        { label: "What's New", href: "/whats-new" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact Sales", href: "/contact" },
        { label: "System Status", href: "/status" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center">
              <Image
                src="/optivex_white_logo.png"
                alt="OptivexIQ"
                width={132}
                height={32}
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 100vw"
                quality={100}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              SaaS Conversion Intelligence. Analyze positioning, uncover gaps,
              and deploy messaging that converts.
            </p>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-4 text-sm font-semibold tracking-[0.14em] text-muted-foreground">
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground/70">
            {"\u00A9"} 2026 OptivexIQ. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/20">|</span>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground/20">|</span>
            <Link
              href="/status"
              className="text-sm text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
