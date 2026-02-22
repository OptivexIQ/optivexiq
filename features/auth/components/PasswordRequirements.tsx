"use client";

import { evaluatePasswordPolicy } from "@/lib/auth/passwordPolicy";

type PasswordRequirementsProps = {
  password: string;
  email: string;
  name: string;
};

export function PasswordRequirements({
  password,
  email,
  name,
}: PasswordRequirementsProps) {
  const { requirements, strength, isValid } = evaluatePasswordPolicy({
    password,
    email,
    name,
  });

  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <p
        className={
          isValid
            ? "font-medium text-emerald-600"
            : "font-medium text-amber-600"
        }
        aria-live="polite"
        aria-atomic="true"
      >
        Password strength: {strength}
      </p>
      <ul className="mt-2 space-y-1" aria-live="polite" aria-atomic="true">
        {requirements.map((item) => (
          <li
            key={item.key}
            className={item.valid ? "text-emerald-600" : "text-red-500"}
          >
            {item.valid ? "✓" : "✕"} {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
