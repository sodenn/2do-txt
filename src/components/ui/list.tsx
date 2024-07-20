import { cn } from "@/utils/tw-utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { HTMLAttributes } from "react";

const listVariants = cva("my-1 flex flex-col", {
  variants: {
    variant: {
      default: "",
      outline: "border rounded-md",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ListProps
  extends HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, variant, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn(listVariants({ variant, className }))}
      {...props}
    />
  ),
);
List.displayName = "List";

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
}

export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ selected, className, ...props }, ref) => (
    <li className="list-none">
      <div
        ref={ref}
        role="button"
        tabIndex={selected ? 0 : -1}
        className={cn(
          "flex w-full items-center gap-4 rounded-md px-3 py-1 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          selected && "bg-accent text-accent-foreground",
          className,
        )}
        {...props}
      />
    </li>
  ),
);
ListItem.displayName = "ListItem";

export const ListItemText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 text-left", className)} {...props} />
));
ListItemText.displayName = "ListItemText";

export const ListItemPrimaryText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
ListItemPrimaryText.displayName = "ListItemPrimaryText";

export const ListItemSecondaryText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("truncate text-sm text-muted-foreground", className)}
    {...props}
  />
));
ListItemSecondaryText.displayName = "ListItemSecondaryText";
