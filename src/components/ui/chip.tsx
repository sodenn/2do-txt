import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, KeyboardEvent } from "react";

import { cn } from "@/utils/tw-utils";

const chipVariants = cva(
  "inline-flex items-center rounded-xl border transition-colors focus:outline-hidden focus-visible:outline-hidden",
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
          "bg-primary border-primary text-primary-foreground hover:brightness-90 focus-visible:brightness-90",
      },
      {
        color: "primary",
        variant: "outline",
        clickable: true,
        className: "border hover:bg-accent focus-visible:bg-accent",
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
        className: "border",
      },
      {
        color: "success",
        variant: "default",
        clickable: true,
        className:
          "bg-success border-success text-success-foreground hover:brightness-90 focus-visible:brightness-90",
      },
      {
        color: "success",
        variant: "outline",
        clickable: true,
        className:
          "text-success border-success hover:bg-success/5 dark:hover:bg-success/15 focus-visible:bg-success/10 dark:focus-visible:bg-success/20",
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
          "bg-info border-info text-info-foreground hover:brightness-90 focus-visible:brightness-90",
      },
      {
        color: "info",
        variant: "outline",
        clickable: true,
        className:
          "text-info border-info hover:bg-info/5 dark:hover:bg-info/15 focus-visible:bg-info/10 dark:focus-visible:bg-info/20",
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
          "bg-warning border-warning text-warning-foreground hover:brightness-90 focus-visible:brightness-90",
      },
      {
        color: "warning",
        variant: "outline",
        clickable: true,
        className:
          "text-warning border-warning hover:bg-warning/5 dark:hover:bg-warning/15 focus-visible:bg-warning/10 dark:focus-visible:bg-warning/20",
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
          "bg-pink-800 dark:bg-pink-600 border-pink-800 dark:border-pink-600 text-primary-foreground hover:brightness-90 focus-visible:brightness-90",
      },
      {
        color: "danger",
        variant: "outline",
        clickable: true,
        className:
          "text-pink-800 dark:text-pink-500 border-pink-800 dark:border-pink-600 hover:bg-pink-800/5 dark:hover:bg-pink-600/15 focus-visible:bg-pink-800/10 dark:focus-visible:bg-pink-600/20",
      },
      {
        color: "danger",
        variant: "default",
        clickable: false,
        className:
          "bg-pink-800 dark:bg-pink-600 border-pink-800 dark:border-pink-600 text-primary-foreground brightness-90",
      },
      {
        color: "danger",
        variant: "outline",
        clickable: false,
        className:
          "text-pink-800 dark:text-pink-500 border-pink-800 dark:border-pink-600 bg-pink-800/5 dark:bg-pink-600/15",
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
  extends
    Omit<HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof chipVariants> {}

function Chip({ className, color, size, variant, ...props }: ChipProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // @ts-ignore
      props.onClick?.(event);
    }
  };

  return (
    <div className="bg-background inline-flex rounded-xl">
      <div
        tabIndex={props.onClick ? 0 : undefined}
        role={props.onClick ? "button" : undefined}
        className={cn(
          chipVariants({ variant, color, size, clickable: !!props.onClick }),
          className,
          props.onClick && "cursor-pointer",
        )}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
}

export { Chip, chipVariants };
