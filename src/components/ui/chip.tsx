import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/utils/tw-utils";

const chipVariants = cva(
  "inline-flex items-center rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2.5 py-[1px]",
  {
    variants: {
      variant: {
        default: "",
        outline: "",
      },
      color: {
        primary: "",
        success: "",
        info: "",
        warning: "",
        danger: "",
      },
    },
    compoundVariants: [
      {
        color: "primary",
        variant: "default",
        className:
          "bg-primary border-primary text-primary-foreground hover:brightness-90",
      },
      {
        color: "primary",
        variant: "outline",
        className: "border-primary hover:bg-primary/5 hover:dark:bg-primary/15",
      },
      {
        color: "success",
        variant: "default",
        className:
          "bg-success border-success text-success-foreground hover:brightness-90",
      },
      {
        color: "success",
        variant: "outline",
        className:
          "text-success border-success hover:bg-success/5 hover:dark:bg-success/15",
      },
      {
        color: "info",
        variant: "default",
        className:
          "bg-info border-info text-info-foreground hover:brightness-90",
      },
      {
        color: "info",
        variant: "outline",
        className:
          "text-info border-info hover:bg-info/5 hover:dark:bg-info/15",
      },
      {
        color: "warning",
        variant: "default",
        className:
          "bg-warning border-warning text-warning-foreground hover:brightness-90",
      },
      {
        color: "warning",
        variant: "outline",
        className:
          "text-warning border-warning hover:bg-warning/5 hover:dark:bg-warning/15",
      },
      {
        color: "danger",
        variant: "default",
        className:
          "bg-danger border-danger text-danger-foreground hover:brightness-90",
      },
      {
        color: "danger",
        variant: "outline",
        className:
          "text-danger border-danger hover:bg-danger/5 hover:dark:bg-danger/15",
      },
    ],
    defaultVariants: {
      variant: "default",
      color: "primary",
    },
  },
);

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof chipVariants> {}

function Chip({ className, color, variant, ...props }: ChipProps) {
  return (
    <div
      className={cn(
        chipVariants({ variant, color }),
        className,
        props.onClick && "cursor-pointer",
      )}
      {...props}
    />
  );
}

export { Chip, chipVariants };
