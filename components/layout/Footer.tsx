export function Footer() {
  const linkGroups = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#solution" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Guides", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <svg
                  width="12"
                  height="12"
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
              <span className="text-sm font-semibold text-foreground">
                OptivexIQ
              </span>
            </a>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              SaaS Conversion Intelligence. Analyze positioning, uncover gaps,
              and deploy messaging that converts.
            </p>
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground/60">
            {"\u00A9"} 2026 OptivexIQ. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Privacy Policy
            </a>
            <span className="text-muted-foreground/20">|</span>
            <a
              href="#"
              className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Terms of Service
            </a>
            <span className="text-muted-foreground/20">|</span>
            <a
              href="#"
              className="text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
