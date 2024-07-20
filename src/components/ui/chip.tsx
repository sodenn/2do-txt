import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

import { cn } from "@/utils/tw-utils";

const chipVariants = cva(
  "inline-flex items-center rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
        secondary: "",
      },
      size: {
        default: "px-2.5 py-[1px]",
        sm: "px-2 text-sm",
      },
      clickable: {
        false: "",
        true: "",
      },
    },
    compoundVariants: [
      {
        color: "primary",
        variant: "default",
        clickable: true,
        className:
          "bg-primary border-primary text-primary-foreground hover:brightness-90",
      },
      {
        color: "primary",
        variant: "outline",
        clickable: true,
        className: "border-primary hover:bg-primary/5 hover:dark:bg-primary/15",
      },
      {
        color: "primary",
        variant: "default",
        clickable: false,
        className:
          "bg-primary border-primary text-primary-foreground brightness-90",
      },
      {
        color: "primary",
        variant: "outline",
        clickable: false,
        className: "border-primary bg-primary/5 dark:bg-primary/15",
      },
      {
        color: "success",
        variant: "default",
        clickable: true,
        className:
          "bg-success border-success text-success-foreground hover:brightness-90",
      },
      {
        color: "success",
        variant: "outline",
        clickable: true,
        className:
          "text-success border-success hover:bg-success/5 hover:dark:bg-success/15",
      },
      {
        color: "success",
        variant: "default",
        clickable: false,
        className:
          "bg-success border-success text-success-foreground brightness-90",
      },
      {
        color: "success",
        variant: "outline",
        clickable: false,
        className:
          "text-success border-success bg-success/5 dark:bg-success/15",
      },
      {
        color: "info",
        variant: "default",
        clickable: true,
        className:
          "bg-info border-info text-info-foreground hover:brightness-90",
      },
      {
        color: "info",
        variant: "outline",
        clickable: true,
        className:
          "text-info border-info hover:bg-info/5 hover:dark:bg-info/15",
      },
      {
        color: "info",
        variant: "default",
        clickable: false,
        className: "bg-info border-info text-info-foreground brightness-90",
      },
      {
        color: "info",
        variant: "outline",
        clickable: false,
        className: "text-info border-info bg-info/5 dark:bg-info/15",
      },
      {
        color: "warning",
        variant: "default",
        clickable: true,
        className:
          "bg-warning border-warning text-warning-foreground hover:brightness-90",
      },
      {
        color: "warning",
        variant: "outline",
        clickable: true,
        className:
          "text-warning border-warning hover:bg-warning/5 hover:dark:bg-warning/15",
      },
      {
        color: "warning",
        variant: "default",
        clickable: false,
        className:
          "bg-warning border-warning text-warning-foreground brightness-90",
      },
      {
        color: "warning",
        variant: "outline",
        clickable: false,
        className:
          "text-warning border-warning bg-warning/5 dark:bg-warning/15",
      },
      {
        color: "danger",
        variant: "default",
        clickable: true,
        className:
          "bg-danger border-danger text-danger-foreground hover:brightness-90",
      },
      {
        color: "danger",
        variant: "outline",
        clickable: true,
        className:
          "text-danger border-danger hover:bg-danger/5 hover:dark:bg-danger/15",
      },
      {
        color: "danger",
        variant: "default",
        clickable: false,
        className:
          "bg-danger border-danger text-danger-foreground brightness-90",
      },
      {
        color: "danger",
        variant: "outline",
        clickable: false,
        className: "text-danger border-danger bg-danger/5 dark:bg-danger/15",
      },
      {
        color: "secondary",
        variant: "default",
        clickable: true,
        className:
          "bg-danger border-danger text-danger-foreground hover:brightness-90",
      },
      {
        color: "secondary",
        variant: "outline",
        clickable: true,
        className:
          "text-secondary-foreground/75 border-secondary-foreground/75 hover:bg-secondary/50 hover:dark:bg-secondary",
      },
      {
        color: "secondary",
        variant: "default",
        clickable: false,
        className:
          "bg-secondary border-secondary text-secondary-foreground brightness-90",
      },
      {
        color: "secondary",
        variant: "outline",
        clickable: false,
        className:
          "text-secondary-foreground/75 border-secondary-foreground/75 bg-secondary/50 dark:bg-secondary",
      },
    ],
    defaultVariants: {
      variant: "default",
      color: "primary",
      size: "default",
      clickable: false,
    },
  },
);

export interface ChipProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof chipVariants> {}

function Chip({ className, color, size, variant, ...props }: ChipProps) {
  return (
    <div className="inline-flex rounded-xl bg-background">
      <div
        className={cn(
          chipVariants({ variant, color, size, clickable: !!props.onClick }),
          className,
          props.onClick && "cursor-pointer",
        )}
        {...props}
      />
    </div>
  );
}

export { Chip, chipVariants };
