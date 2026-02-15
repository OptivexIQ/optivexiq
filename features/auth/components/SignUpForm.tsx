"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
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
                <Input {...field} type="email" autoComplete="email" required />
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
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </FormControl>
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
        <Button
          type="submit"
          disabled={!formState.isValid || isPending || !policy.isValid}
        >
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
