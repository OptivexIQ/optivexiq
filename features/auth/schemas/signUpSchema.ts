import { z } from "zod";
import { evaluatePasswordPolicy } from "@/lib/auth/passwordPolicy";

export const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().max(100).optional(),
  })
  .superRefine((values, context) => {
    const policy = evaluatePasswordPolicy({
      password: values.password,
      email: values.email,
      name: values.name,
    });

    if (!policy.isValid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password does not meet the requirements.",
        path: ["password"],
      });
    }
  });

export type SignUpValues = z.infer<typeof signUpSchema>;
