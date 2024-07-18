import { cn } from "@/utils/tw-utils";
import * as React from "react";

export const List = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("my-1 flex flex-col", className)} {...props} />
));
List.displayName = "List";

interface ListItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  disabled?: boolean;
}

export const ListItem = React.forwardRef<HTMLButtonElement, ListItemProps>(
  ({ selected, className, ...props }, ref) => (
    <li>
      <button
        ref={ref}
        role="button"
        tabIndex={selected ? 0 : -1}
        className={cn(
          "flex items-center gap-4 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
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
