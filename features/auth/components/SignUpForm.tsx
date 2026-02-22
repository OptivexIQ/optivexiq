"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signUpAction } from "@/app/actions/auth/signUp";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { evaluatePasswordPolicy } from "@/lib/auth/passwordPolicy";
import {
  signUpSchema,
  type SignUpValues,
} from "@/features/auth/schemas/signUpSchema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toFormData } from "@/lib/forms/toFormData";

type Props = {
  redirectTo?: string | null;
};

export function SignUpForm({ redirectTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const { formState, clearErrors, setError, watch, handleSubmit } = form;

  const email = watch("email") ?? "";
  const name = watch("name") ?? "";
  const password = watch("password") ?? "";

  const policy = useMemo(
    () => evaluatePasswordPolicy({ password, email, name }),
    [password, email, name],
  );

  const onSubmit = handleSubmit((values) => {
    clearErrors("root");

    startTransition(async () => {
      const formData = toFormData({
        name: values.name ?? "",
        email: values.email,
        password: values.password,
      });
      if (redirectTo) {
        formData.set("redirect", redirectTo);
      }

      const result = await signUpAction({ error: null }, formData);

      if (result?.error) {
        setError("root", { message: result.error });
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} type="text" autoComplete="name" />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="pr-10"
                  />
                </FormControl>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {password.length > 0 ? (
          <PasswordRequirements password={password} email={email} name={name} />
        ) : null}
        {formState.errors.root?.message ? (
          <p className="text-sm text-red-500" role="alert">
            {formState.errors.root.message}
          </p>
        ) : null}
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
          disabled={!formState.isValid || isPending || !policy.isValid}
          className="min-w-40"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
}
