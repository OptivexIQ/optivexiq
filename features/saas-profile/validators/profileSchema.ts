import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");
const placeholderValues = new Set([
  "n/a",
  "na",
  "none",
  "todo",
  "tbd",
  "test",
  "testing",
  "lorem",
  "lorem ipsum",
  "placeholder",
  "asdf",
  "qwerty",
]);

const requiredLongText = z
  .string()
  .trim()
  .min(20, "Provide at least 20 characters")
  .refine((value) => {
    const normalized = value.toLowerCase().trim();
    if (placeholderValues.has(normalized)) {
      return false;
    }
    return !normalized.includes("lorem ipsum");
  }, "Use real content, not placeholder text");

const requiredUrl = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .min(1, "Required");

const textItemSchema = z.object({
  value: requiredString,
});

export const differentiationRowSchema = z.object({
  competitor: requiredString,
  ourAdvantage: requiredString,
  theirAdvantage: requiredString,
});

export const profileSchema = z.object({
  icpRole: requiredString,
  primaryPain: requiredLongText,
  buyingTrigger: requiredLongText,
  websiteUrl: requiredUrl,
  acvRange: z.enum(["<€10k", "€10k-50k", "€50k-150k", "€150k-500k", "€500k+"], {
    required_error: "Required",
  }),
  revenueStage: z.enum(["pre", "<€10k", "€10k-50k", "€50k+"], {
    required_error: "Required",
  }),
  salesMotion: requiredString,
  conversionGoal: z.enum(["demo", "trial", "paid", "educate"], {
    required_error: "Required",
  }),
  pricingModel: requiredString,
  keyObjections: z.array(textItemSchema).min(1, "Add at least one objection"),
  proofPoints: z.array(textItemSchema).min(1, "Add at least one proof point"),
  differentiationMatrix: z
    .array(differentiationRowSchema)
    .min(1, "Add at least one competitor"),
  onboardingProgress: z.number().int().min(0),
  onboardingCompleted: z.boolean(),
  updatedAt: z.string().datetime().optional().nullable(),
  onboardingCompletedAt: z.string().datetime().optional().nullable(),
});

export const profileUpdateSchema = z.object({
  icpRole: requiredString,
  primaryPain: requiredLongText,
  buyingTrigger: requiredLongText,
  websiteUrl: requiredUrl,
  acvRange: z.enum(["<€10k", "€10k-50k", "€50k-150k", "€150k-500k", "€500k+"], {
    required_error: "Required",
  }),
  revenueStage: z.enum(["pre", "<€10k", "€10k-50k", "€50k+"], {
    required_error: "Required",
  }),
  salesMotion: requiredString,
  conversionGoal: z.enum(["demo", "trial", "paid", "educate"], {
    required_error: "Required",
  }),
  pricingModel: requiredString,
  keyObjections: z.array(textItemSchema).min(1, "Add at least one objection"),
  proofPoints: z.array(textItemSchema).min(1, "Add at least one proof point"),
  differentiationMatrix: z
    .array(differentiationRowSchema)
    .min(1, "Add at least one competitor"),
  onboardingProgress: z.number().int().min(0),
  onboardingCompleted: z.boolean(),
  updatedAt: z.string().datetime().optional().nullable(),
  onboardingCompletedAt: z.string().datetime().optional().nullable(),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export function isProfileComplete(values: ProfileValues | null) {
  if (!values) {
    return false;
  }

  if (values.onboardingCompletedAt) {
    return true;
  }

  return profileSchema.safeParse(values).success;
}
