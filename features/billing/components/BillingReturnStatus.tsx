"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBillingEntitlement } from "@/features/billing/services/billingReturnClient";

type Props = {
  checkoutRef: string | null;
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export function BillingReturnStatus({ checkoutRef }: Props) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [entitledPlan, setEntitledPlan] = useState<string | null>(null);

  const title = useMemo(() => {
    if (timedOut) {
      return "We are still confirming your purchase.";
    }
    if (error) {
      return "We could not confirm your purchase yet.";
    }
    return "Confirming your purchase...";
  }, [error, timedOut]);

  const canPoll = !timedOut && attempts < MAX_POLL_ATTEMPTS;

  useEffect(() => {
    if (!canPoll) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) {
        return;
      }

      setAttempts((current) => current + 1);

      try {
        const entitlement = await fetchBillingEntitlement();
        if (cancelled) {
          return;
        }

        if (entitlement.isEntitled) {
          setEntitledPlan(entitlement.plan);
          router.replace("/dashboard");
          return;
        }
      } catch {
        if (cancelled) {
          return;
        }
        setError("Confirmation is taking longer than expected.");
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [canPoll, router]);

  useEffect(() => {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      setTimedOut(true);
    }
  }, [attempts]);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border/60 bg-card p-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {timedOut
          ? "This can take up to a minute while billing events finalize."
          : "Please wait while we verify your entitlement and activate access."}
      </p>
      {checkoutRef ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Reference: {checkoutRef}
        </p>
      ) : null}
      {entitledPlan ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Plan confirmed: {entitledPlan}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {timedOut ? (
        <div className="mt-5 flex items-center gap-4">
          <Link href="/contact" className="text-sm text-primary hover:underline">
            Contact support
          </Link>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Go to dashboard
          </Link>
        </div>
      ) : null}
    </div>
  );
}

