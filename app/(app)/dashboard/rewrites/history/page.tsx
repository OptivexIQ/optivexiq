import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { listRewriteHistoryForUser } from "@/features/rewrites/services/rewriteHistoryReadService";

function formatHistoryTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RewritesHistoryPage() {
  const user = await requireUser();
  const history = await listRewriteHistoryForUser(user.id, 50);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Rewrite Studio
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Version history
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/rewrites">Back to studio</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rewrite history yet. Run a rewrite to create your first version.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 bg-secondary/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {item.rewriteType === "pricing"
                      ? "Pricing rewrite"
                      : "Homepage rewrite"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatHistoryTimestamp(item.createdAt)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Request: {item.requestRef}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-foreground/90">
                  {item.outputMarkdown}
                </p>
                <div className="mt-3">
                  <Button asChild size="sm">
                    <Link href={`/dashboard/rewrites?requestRef=${encodeURIComponent(item.requestRef)}`}>
                      Load in studio
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
