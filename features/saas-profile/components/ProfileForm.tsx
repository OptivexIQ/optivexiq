"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveProfileAction } from "@/app/actions/saas-profile/saveProfile";
import {
  defaultSaasProfileValues,
  type SaasProfileFormValues,
} from "@/features/saas-profile/types/profile.types";
import {
  profileSchema,
  profileUpdateSchema,
} from "@/features/saas-profile/validators/profileSchema";
import { ObjectionsInput } from "@/features/saas-profile/components/ObjectionsInput";
import { ProofPointsInput } from "@/features/saas-profile/components/ProofPointsInput";
import { DifferentiationMatrix } from "@/features/saas-profile/components/DifferentiationMatrix";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

const stepOneFields: Array<keyof SaasProfileFormValues> = [
  "icpRole",
  "primaryPain",
  "buyingTrigger",
  "websiteUrl",
  "acvRange",
  "revenueStage",
  "salesMotion",
  "conversionGoal",
  "pricingModel",
];

type ProfileFormProps = {
  initialValues?: SaasProfileFormValues | null;
  mode?: "onboarding" | "edit";
  layout?: "steps" | "sections";
};

export function ProfileForm({ initialValues, mode, layout }: ProfileFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const formMode = mode ?? "edit";
  const formLayout = layout ?? "steps";
  const isEditing = Boolean(
    initialValues?.updatedAt || initialValues?.onboardingCompletedAt,
  );
  const conflictMessage =
    "Profile was updated elsewhere. Refresh and try again.";
  const form = useForm<SaasProfileFormValues>({
    resolver: zodResolver(
      formMode === "onboarding" ? profileSchema : profileUpdateSchema,
    ),
    defaultValues: initialValues ?? defaultSaasProfileValues,
    mode: "onChange",
  });

  const {
    formState,
    trigger,
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    reset,
  } = form;

  const canSubmit = useMemo(
    () => !isPending && formState.isDirty && formState.isValid,
    [formState.isDirty, formState.isValid, isPending],
  );

  const handleNext = async () => {
    const valid = await trigger(stepOneFields, { shouldFocus: true });

    if (valid) {
      setStep(2);
    }
  };

  const onSubmit = handleSubmit((values) => {
    clearErrors("root");

    startTransition(async () => {
      const result = await saveProfileAction(values, { mode: formMode });

      if (result?.error) {
        setError("root", { message: result.error });

        if (result.error === conflictMessage) {
          toast({
            title: "Update conflict",
            description: result.error,
            action: (
              <ToastAction
                altText="Refresh"
                onClick={() => window.location.reload()}
              >
                Refresh
              </ToastAction>
            ),
          });
        }
        return;
      }

      if (result?.updatedAt) {
        setValue("updatedAt", result.updatedAt, { shouldDirty: false });
      }

      if (result?.onboardingCompletedAt) {
        setValue("onboardingCompletedAt", result.onboardingCompletedAt, {
          shouldDirty: false,
        });
      }

      reset(values, { keepValues: true });

      toast({
        title: "Profile saved",
        description: "Your onboarding details have been updated.",
      });

      if (formMode === "onboarding") {
        const target = result?.snapshotReportId
          ? `/dashboard/reports/snapshot?reportId=${result.snapshotReportId}`
          : "/dashboard/reports/snapshot";
        router.push(target);
      }
    });
  });

  const submitLabel = isEditing ? "Update profile" : "Save profile";

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        {formLayout === "sections" ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <div className="mb-4 space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  ICP & market
                </h2>
                <p className="text-sm text-muted-foreground">
                  Define the buyer role and deal size OptivexIQ should optimize
                  for.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="icpRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ICP role</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. VP Growth" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryPain"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Primary pain</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the biggest pain your ICP experiences without your product."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buyingTrigger"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Buying trigger</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What event or signal triggers buyers to evaluate solutions like yours?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="acvRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ACV range</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ACV range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="<€10k">&lt;€10k</SelectItem>
                          <SelectItem value="€10k-50k">€10k–€50k</SelectItem>
                          <SelectItem value="€50k-150k">€50k–€150k</SelectItem>
                          <SelectItem value="€150k-500k">
                            €150k–€500k
                          </SelectItem>
                          <SelectItem value="€500k+">€500k+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="revenueStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue stage</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select revenue stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pre">Pre-revenue</SelectItem>
                          <SelectItem value="<€10k">&lt;€10k MRR</SelectItem>
                          <SelectItem value="€10k-50k">
                            €10k–€50k MRR
                          </SelectItem>
                          <SelectItem value="€50k+">€50k+ MRR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://yourcompany.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <div className="mb-4 space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Sales motion & pricing
                </h2>
                <p className="text-sm text-muted-foreground">
                  These inputs determine how we frame urgency, risk, and value
                  in your conversion audits.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="salesMotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales motion</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Sales-led" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conversionGoal"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Conversion goal</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid gap-3"
                        >
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="demo" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Get more demos
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="trial" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Get more free trials
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="paid" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Convert to paid
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <RadioGroupItem value="educate" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Educate before sales
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing model</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Per seat" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <div className="mb-4 space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Key objections
                </h2>
                <p className="text-sm text-muted-foreground">
                  Capture the friction points your buyers cite most often.
                </p>
              </div>
              <ObjectionsInput control={form.control} />
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <div className="mb-4 space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Proof points
                </h2>
                <p className="text-sm text-muted-foreground">
                  Document proof that validates your positioning in competitive
                  evaluations.
                </p>
              </div>
              <ProofPointsInput control={form.control} />
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6">
              <div className="mb-4 space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Differentiation matrix
                </h2>
                <p className="text-sm text-muted-foreground">
                  Map how you win against each competitor and where they still
                  hold ground.
                </p>
              </div>
              <DifferentiationMatrix control={form.control} />
            </div>

            {form.formState.errors.root?.message ? (
              <p className="text-sm text-red-500" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="submit" disabled={!canSubmit}>
                {isPending ? "Saving..." : submitLabel}
              </Button>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="icpRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ICP role</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. VP Growth" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryPain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary pain</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the biggest pain your ICP experiences without your product."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyingTrigger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buying trigger</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What event or signal triggers buyers to evaluate solutions like yours?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="acvRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ACV range</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ACV range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="<€10k">&lt;€10k</SelectItem>
                      <SelectItem value="€10k-50k">€10k–€50k</SelectItem>
                      <SelectItem value="€50k-150k">€50k–€150k</SelectItem>
                      <SelectItem value="€150k-500k">€150k–€500k</SelectItem>
                      <SelectItem value="€500k+">€500k+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenueStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue stage</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select revenue stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pre">Pre-revenue</SelectItem>
                      <SelectItem value="<€10k">&lt;€10k MRR</SelectItem>
                      <SelectItem value="€10k-50k">€10k–€50k MRR</SelectItem>
                      <SelectItem value="€50k+">€50k+ MRR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://yourcompany.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salesMotion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales motion</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Sales-led" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conversionGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversion goal</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-3"
                    >
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <RadioGroupItem value="demo" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Get more demos
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <RadioGroupItem value="trial" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Get more free trials
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <RadioGroupItem value="paid" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Convert to paid
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-3">
                        <FormControl>
                          <RadioGroupItem value="educate" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Educate before sales
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricingModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing model</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Per seat" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ObjectionsInput control={form.control} />
            <ProofPointsInput control={form.control} />
            <DifferentiationMatrix control={form.control} />
            {form.formState.errors.root?.message ? (
              <p className="text-sm text-red-500" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isPending ? "Saving..." : submitLabel}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
