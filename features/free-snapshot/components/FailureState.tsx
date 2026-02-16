import { Button } from "@/components/ui/button";

export function FailureState(props: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8">
      <h3 className="text-2xl font-semibold text-foreground">
        We couldn't fully analyze this site.
      </h3>
      <p className="mt-3 text-sm text-muted-foreground">
        Some websites block automated analysis. You can try again or use a
        different URL.
      </p>
      <Button className="mt-6" onClick={props.onRetry}>
        Try Again
      </Button>
    </div>
  );
}
