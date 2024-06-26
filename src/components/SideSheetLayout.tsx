import clsx from "clsx";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

interface HeaderContainerProps {
  open: boolean;
  children: ReactNode;
}

export interface LayoutContentProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
}

export function LayoutHeader({ open, children }: HeaderContainerProps) {
  return (
    <div
      className={clsx(
        "flex-none xl:transition-all",
        open && `xl:ml-[320px] xl:duration-225 xl:ease-out`,
        !open && "xl:duration-195 xl:ease-in",
      )}
    >
      {children}
    </div>
  );
}

export const LayoutContent = forwardRef<HTMLDivElement, LayoutContentProps>(
  ({ open, children }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "overflow-y-auto flex-auto xl:flex-grow xl:-ml-[320px]",
          open && `xl:ml-0 xl:duration-225 xl:ease-out`,
          !open && "xl:duration-195 xl:ease-in",
        )}
      >
        {children}
      </div>
    );
  },
);
