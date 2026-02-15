"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/actions/auth/signOut";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  const label = pending ? "Signing out..." : "Sign out";

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {label}
    </Button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
