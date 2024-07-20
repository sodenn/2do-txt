import { cn } from "@/utils/tw-utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, PropsWithChildren } from "react";

const tagBoxVariants = cva("inline rounded-sm whitespace-nowrap", {
  variants: {
    variant: {
      default: "",
      outline: "px-1 border",
    },
    color: {
      primary: "text-primary",
      success: "text-success",
      info: "text-info",
      warning: "text-warning",
      priority: "text-pink-800 dark:text-pink-500",
      muted: "text-muted-foreground",
    },
  },
  compoundVariants: [
    {
      color: "primary",
      variant: "outline",
      className: "border-primary bg-primary/5",
    },
    {
      color: "success",
      variant: "outline",
      className: "border-success bg-success/5",
    },
    {
      color: "info",
      variant: "outline",
      className: "border-info bg-info/5",
    },
    {
      color: "warning",
      variant: "outline",
      className: "border-warning bg-warning/5",
    },
    {
      color: "priority",
      variant: "outline",
      className:
        "border-pink-800 bg-pink-800/5 dark:border-pink-600 dark:bg-pink-600/5",
    },
  ],
  defaultVariants: {
    variant: "default",
    color: "primary",
  },
});

export interface TagBoxProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof tagBoxVariants> {}

export function TagBox({
  variant,
  color,
  className,
  ...props
}: PropsWithChildren<TagBoxProps>) {
  return (
    <span
      className={cn(tagBoxVariants({ variant, color, className }))}
      {...props}
    />
  );
}
