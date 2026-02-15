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

type ObjectionsInputProps = {
  control: Control<SaasProfileFormValues>;
};

export function ObjectionsInput({ control }: ObjectionsInputProps) {
  const { fields, append, remove } = useFieldArray<
    SaasProfileFormValues,
    "keyObjections"
  >({
    control,
    name: "keyObjections",
  });

  return (
    <div className="space-y-3">
      <FormLabel htmlFor="key-objections-0">Key objections</FormLabel>
      {fields.map((field, index) => (
        <FormField
          key={field.id}
          control={control}
          name={`keyObjections.${index}.value`}
          render={({ field: inputField }) => (
            <FormItem>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...inputField}
                    placeholder="e.g. Too expensive"
                    id={`key-objections-${index}`}
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
        Add objection
      </Button>
    </div>
  );
}
