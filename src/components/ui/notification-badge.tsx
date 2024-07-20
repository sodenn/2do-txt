import { HTMLAttributes, ReactNode } from "react";

export interface NotificationBadgeProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
}

function NotificationBadge({
  children,
  label,
  ...rest
}: NotificationBadgeProps) {
  return (
    <div className="relative inline-block" {...rest}>
      {children}
      <div className="absolute -end-2 -top-2 z-[1] inline-flex h-[1.23rem] w-[1.23rem] items-center justify-center rounded-full border border-secondary-foreground/20 bg-secondary text-xs font-bold text-secondary-foreground/70">
        {label}
      </div>
    </div>
  );
}

export { NotificationBadge };
