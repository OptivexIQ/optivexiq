import { z } from "zod";
import {
  ACV_RANGE_VALUES,
  CONVERSION_GOAL_VALUES,
  REVENUE_STAGE_VALUES,
} from "@/features/saas-profile/constants/profileEnums";
import {
  normalizeAcvRangeValue,
  normalizeConversionGoalValue,
  normalizeRevenueStageValue,
  sanitizeProfileText,
} from "@/features/saas-profile/validators/profileNormalization";

const requiredString = z.preprocess(
  (value) => (typeof value === "string" ? sanitizeProfileText(value) : value),
  z.string().trim().min(1, "Required"),
);
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
  .preprocess(
    (value) => (typeof value === "string" ? sanitizeProfileText(value) : value),
    z.string().trim().min(20, "Provide at least 20 characters"),
  )
  .refine((value: string) => {
    const normalized = value.toLowerCase().trim();
    if (placeholderValues.has(normalized)) {
      return false;
    }
    return !normalized.includes("lorem ipsum");
  }, "Use real content, not placeholder text");

const requiredUrl = z
  .preprocess(
    (value) => (typeof value === "string" ? sanitizeProfileText(value) : value),
    z.string().trim().url("Enter a valid URL").min(1, "Required"),
  )
;

const textItemSchema = z.object({
  value: requiredString,
});

export const differentiationRowSchema = z.object({
  competitor: requiredString,
  ourAdvantage: requiredString,
  theirAdvantage: requiredString,
});

const acvRangeSchema = z.preprocess(
  (value) => normalizeAcvRangeValue(value) ?? value,
  z.enum(ACV_RANGE_VALUES, { required_error: "Required" }),
);

const revenueStageSchema = z.preprocess(
  (value) => normalizeRevenueStageValue(value) ?? value,
  z.enum(REVENUE_STAGE_VALUES, { required_error: "Required" }),
);

const conversionGoalSchema = z.preprocess(
  (value) => normalizeConversionGoalValue(value) ?? value,
  z.enum(CONVERSION_GOAL_VALUES, { required_error: "Required" }),
);

export const profileSchema = z.object({
  icpRole: requiredString,
  primaryPain: requiredLongText,
  buyingTrigger: requiredLongText,
  websiteUrl: requiredUrl,
  acvRange: acvRangeSchema,
  revenueStage: revenueStageSchema,
  salesMotion: requiredString,
  conversionGoal: conversionGoalSchema,
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
  acvRange: acvRangeSchema,
  revenueStage: revenueStageSchema,
  salesMotion: requiredString,
  conversionGoal: conversionGoalSchema,
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
