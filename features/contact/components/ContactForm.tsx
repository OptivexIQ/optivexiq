"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitContactAction, type ContactActionState } from "@/app/actions/contact/submitContact";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_TOPICS,
  CONTACT_TOPIC_HELPERS,
  type ContactTopicValue,
} from "@/features/contact/constants/contactTopics";
import { contactRequestSchema } from "@/features/contact/validators/contactRequestSchema";
import { toFormData } from "@/lib/forms/toFormData";

const INITIAL_STATE: ContactActionState = { success: false, error: null };

const contactFormSchema = contactRequestSchema.omit({ honeypot: true });
type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [actionState, setActionState] = useState<ContactActionState>(INITIAL_STATE);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: "support",
      company: "",
      message: "",
    },
    mode: "onChange",
  });

  const topic = form.watch("topic") as ContactTopicValue;
  const topicHelper = useMemo(() => CONTACT_TOPIC_HELPERS[topic] ?? CONTACT_TOPIC_HELPERS.support, [topic]);

  const onSubmit = form.handleSubmit((values) => {
    setActionState(INITIAL_STATE);
    startTransition(async () => {
      const formData = toFormData(values);
      formData.set("website", "");

      const result = await submitContactAction(INITIAL_STATE, formData);
      setActionState(result);

      if (result.success) {
        form.reset({
          name: "",
          email: "",
          topic: "support",
          company: "",
          message: "",
        });
      }
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur"
      >
        <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Full name
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Jane Doe" className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Work email
                </FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="jane@company.com" className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Topic
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTACT_TOPICS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{topicHelper}</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Company (optional)
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your company" className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                How can we help?
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe your request, current setup, and any urgency."
                  rows={6}
                  className="min-h-36"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {actionState.error ? (
          <p className="text-sm text-destructive" role="alert">
            {actionState.error}
          </p>
        ) : null}
        {actionState.success ? (
          <p className="text-sm text-emerald-600" role="status">
            Request received. Confirmation was sent to your email.
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
            disabled={!form.formState.isValid || isPending || form.formState.isSubmitting}
          >
            {isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
