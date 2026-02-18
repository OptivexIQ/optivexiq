"use client";

import { useState, useTransition, type FormEvent } from "react";
import { MessageSquarePlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  submitFeedbackAction,
  type FeedbackActionState,
} from "@/app/actions/feedback/submitFeedback";

type FeedbackQuickModalProps = {
  compact?: boolean;
};

const INITIAL_STATE: FeedbackActionState = {
  success: false,
  error: null,
  referenceId: null,
  duplicate: false,
};

function resolveProductArea(pathname: string): string {
  if (pathname.startsWith("/dashboard/gap-engine")) {
    return "gap_engine";
  }
  if (pathname.startsWith("/dashboard/reports")) {
    return "reports";
  }
  if (pathname.startsWith("/dashboard/billing")) {
    return "billing";
  }
  return "dashboard";
}

export function FeedbackQuickModal({ compact = false }: FeedbackQuickModalProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FeedbackActionState>(INITIAL_STATE);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(INITIAL_STATE);

    const formData = new FormData();
    formData.set("requestType", "feature");
    formData.set("title", title);
    formData.set("summary", summary);
    formData.set("productArea", resolveProductArea(pathname));
    formData.set("impact", "medium");
    formData.set("pageUrl", typeof window !== "undefined" ? window.location.href : pathname);
    formData.set("email", email);
    formData.set("name", "");
    formData.set("company", "");
    formData.set("reproductionSteps", "");
    formData.set("expectedBehavior", "");
    formData.set("actualBehavior", "");
    formData.set("website", "");

    startTransition(async () => {
      const result = await submitFeedbackAction(INITIAL_STATE, formData);
      setState(result);
      if (!result.success) {
        return;
      }

      setTitle("");
      setSummary("");
      setEmail("");
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" aria-label="Give feedback">
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="justify-start text-xs">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Give feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give feedback</DialogTitle>
          <DialogDescription>
            Share feature suggestions in under a minute. We review submissions weekly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short summary"
              required
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">Details</span>
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Describe the feature and why it matters."
              rows={5}
              required
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-foreground">Work email</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
            />
          </label>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.success && !state.duplicate ? (
            <p className="text-sm text-emerald-600">
              We have received your feedback.
              {state.referenceId
                ? ` Reference ID: ${state.referenceId}. Please keep this for follow-up.`
                : ""}
            </p>
          ) : null}
          {state.success && state.duplicate ? (
            <p className="text-sm text-amber-600">
              A similar submission was already received recently.
              {state.referenceId
                ? ` Reference ID: ${state.referenceId}. Please use this for follow-up.`
                : ""}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || title.trim().length < 6 || summary.trim().length < 30}
            >
              {isPending ? "Submitting..." : "Submit feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
