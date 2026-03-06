"use client";

type RewriteSectionNavItem = {
  id: string;
  label: string;
};

type RewriteSectionNavProps = {
  items: RewriteSectionNavItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export function RewriteSectionNav({
  items,
  activeId,
  onSelect,
}: RewriteSectionNavProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Sections</span>
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
