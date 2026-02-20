"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  submitContactAction,
  type ContactActionState,
} from "@/app/actions/contact/submitContact";
import {
  CONTACT_TOPICS,
  CONTACT_TOPIC_HELPERS,
  type ContactTopicValue,
} from "@/features/contact/constants/contactTopics";

const INITIAL_STATE: ContactActionState = {
  success: false,
  error: null,
};

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ContactActionState>(INITIAL_STATE);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopicValue>("support");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      email.trim().length > 3 &&
      message.trim().length >= 20
    );
  }, [name, email, message]);
  const topicHelper = CONTACT_TOPIC_HELPERS[topic];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(INITIAL_STATE);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("topic", topic);
    formData.set("company", company);
    formData.set("message", message);
    formData.set("website", "");

    startTransition(async () => {
      const result = await submitContactAction(INITIAL_STATE, formData);
      setState(result);

      if (result.success) {
        setName("");
        setEmail("");
        setTopic("support");
        setCompany("");
        setMessage("");
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur"
    >
      <input
        type="text"
        name="website"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Full name
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            required
            className="h-11"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Work email
          </span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jane@company.com"
            required
            className="h-11"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Topic
          </span>
          <Select
            value={topic}
            onValueChange={(value) =>
                setTopic(value as ContactTopicValue)
              }
            >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TOPICS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{topicHelper}</p>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Company (optional)
          </span>
          <Input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Your company"
            className="h-11"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          How can we help?
        </span>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe your request, current setup, and any urgency."
          rows={6}
          required
          className="min-h-36"
        />
      </label>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-emerald-600" role="status">
          Request received. We will route this to the right team and follow up by email.
        </p>
      ) : null}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          By submitting this form, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
        <Button
          type="submit"
          className="h-11 px-5"
          disabled={!canSubmit || isPending}
        >
          {isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
