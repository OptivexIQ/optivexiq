import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PositioningMapNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Report not found
      </h1>
      <p className="text-sm text-muted-foreground">
        This report is unavailable or has been deleted.
      </p>
      <Button asChild variant="secondary">
        <Link href="/dashboard/reports">Back to reports</Link>
      </Button>
    </div>
  );
}
