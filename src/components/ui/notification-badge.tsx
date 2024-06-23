import * as React from "react";
import { ReactNode } from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
}

function NotificationBadge({ children, label, ...rest }: BadgeProps) {
  return (
    <div className="relative inline-block" {...rest}>
      {children}
      <div className="absolute inline-flex items-center justify-center w-[1.23rem] h-[1.23rem] text-xs font-bold bg-primary text-primary-foreground border-2 border-input rounded-full -top-2 -end-2 z-[1]">
        {label}
      </div>
    </div>
  );
}

export { NotificationBadge };
