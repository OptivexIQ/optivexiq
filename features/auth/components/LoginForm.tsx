"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInAction } from "@/app/actions/auth/signIn";
import {
  loginSchema,
  type LoginValues,
} from "@/features/auth/schemas/loginSchema";
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

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const { formState, clearErrors, setError, handleSubmit } = form;

  const onSubmit = handleSubmit((values) => {
    clearErrors("root");

    startTransition(async () => {
      const formData = toFormData(values);

      const result = await signInAction({ error: null }, formData);

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
                  autoComplete="current-password"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {formState.errors.root?.message ? (
          <p className="text-sm text-red-500" role="alert">
            {formState.errors.root.message}
          </p>
        ) : null}
        <Button type="submit" disabled={!formState.isValid || isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
