"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva("h-full w-full flex-1 transition-all", {
  variants: {
    variant: {
      default: "bg-primary",
      critical: "bg-[linear-gradient(to_right,hsl(0_84%_60%),hsl(43_74%_66%))]",
      "critical-solid": "bg-[hsl(0_84%_60%)]",
      warning: "bg-[linear-gradient(to_right,hsl(0_84%_60%),hsl(43_74%_66%))]",
      "warning-solid": "bg-[hsl(43_74%_66%)]",
      info: "bg-[linear-gradient(to_right,hsl(210_70%_55%),hsl(175_60%_45%))]",
      "info-solid": "bg-[hsl(210_70%_55%)]",
      performance:
        "bg-[linear-gradient(to_right,hsl(210_70%_55%),hsl(175_60%_45%))]",
      "performance-solid": "bg-[hsl(175_60%_45%)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type ProgressProps = React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> &
  VariantProps<typeof progressVariants>;

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressVariants({ variant }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
