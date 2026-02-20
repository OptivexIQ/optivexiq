"use client";

import type { RewriteType } from "@/features/rewrites/types/rewrites.types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RewriteTypePickerProps = {
  value: RewriteType;
  onChange: (value: RewriteType) => void;
  disabled?: boolean;
};

export function RewriteTypePicker({
  value,
  onChange,
  disabled,
}: RewriteTypePickerProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as RewriteType)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger disabled={disabled} value="homepage">
          Homepage rewrite
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value="pricing">
          Pricing rewrite
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

