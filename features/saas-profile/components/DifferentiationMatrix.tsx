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

type DifferentiationMatrixProps = {
  control: Control<SaasProfileFormValues>;
};

export function DifferentiationMatrix({ control }: DifferentiationMatrixProps) {
  const { fields, append, remove } = useFieldArray<
    SaasProfileFormValues,
    "differentiationMatrix"
  >({
    control,
    name: "differentiationMatrix",
  });

  return (
    <div className="space-y-3">
      <FormLabel>Differentiation matrix</FormLabel>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 md:grid-cols-3">
            <FormField
              control={control}
              name={`differentiationMatrix.${index}.competitor`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormControl>
                    <Input {...inputField} placeholder="Competitor" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`differentiationMatrix.${index}.ourAdvantage`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormControl>
                    <Input {...inputField} placeholder="Your advantage" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`differentiationMatrix.${index}.theirAdvantage`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormControl>
                    <Input {...inputField} placeholder="Their advantage" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                Remove row
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          append({ competitor: "", ourAdvantage: "", theirAdvantage: "" })
        }
      >
        Add competitor
      </Button>
    </div>
  );
}
