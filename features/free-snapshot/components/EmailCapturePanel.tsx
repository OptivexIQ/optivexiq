"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function EmailCapturePanel(props: {
  initialEmail: string;
  onSubmit: (input: { email: string; consent: boolean }) => Promise<void>;
}) {
  const [email, setEmail] = useState(props.initialEmail);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await props.onSubmit({ email: email.trim(), consent });
      setComplete(true);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to unlock snapshot.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border/60 bg-card/90 p-5"
    >
      <p className="text-sm font-semibold text-foreground">
        Download Snapshot Report (PDF)
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Enter your email to unlock full PDF.
      </p>

      <div className="mt-4 grid gap-3">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          disabled={isSubmitting}
          required
        />
        <div className="flex items-start gap-2">
          <Checkbox
            id="free-snapshot-consent"
            checked={consent}
            onCheckedChange={(value) => setConsent(value === true)}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="free-snapshot-consent"
            className="text-xs leading-relaxed text-muted-foreground"
          >
            I agree to receive this snapshot and related product updates.
          </Label>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {complete ? (
          <p className="text-xs text-chart-3">Snapshot sent to your inbox.</p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Preparing PDF..." : "Download Snapshot Report (PDF)"}
        </Button>
      </div>
    </form>
  );
}
