import { HTMLAttributes, ReactNode } from "react";

export interface NotificationBadgeProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
}

function NotificationBadge({
  children,
  label,
  ...rest
}: NotificationBadgeProps) {
  if (!label) {
    return children;
  }
  return (
    <div className="relative inline-block" {...rest}>
      {children}
      <div className="border-accent-foreground/20 bg-accent text-secondary-foreground/70 absolute -end-2 -top-2 z-1 inline-flex h-[1.23rem] w-[1.23rem] items-center justify-center rounded-full border text-xs font-bold">
        {label}
      </div>
    </div>
  );
}

export { NotificationBadge };
