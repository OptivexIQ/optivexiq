"use client";

import { useFieldArray, type Control } from "react-hook-form";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type ProofPointsInputProps = {
  control: Control<SaasProfileFormValues>;
};

export function ProofPointsInput({ control }: ProofPointsInputProps) {
  const { fields, append, remove } = useFieldArray<
    SaasProfileFormValues,
    "proofPoints"
  >({
    control,
    name: "proofPoints",
  });

  return (
    <div className="space-y-3">
      <FormLabel htmlFor="proof-points-0">Proof points</FormLabel>
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`proofPoints.${index}.value`}
          render={({ field: inputField }) => (
            <FormItem>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...inputField}
                    placeholder="e.g. 27% lift in demo conversions"
                    id={`proof-points-${index}`}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  Remove
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => append({ value: "" })}
      >
        Add proof point
      </Button>
    </div>
  );
}
