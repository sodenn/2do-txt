import { useBreakpoint } from "@/components/Breakpoint";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import clsx from "clsx";
import { HTMLAttributes, ReactNode, forwardRef } from "react";

interface HeaderContainerProps {
  open: boolean;
  children: ReactNode;
}

export interface LayoutContentProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
}

function usePersistentSidebar() {
  const { isBreakpointActive } = useBreakpoint();
  return isBreakpointActive("xl");
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

export function LayoutSidebar({
  open,
  onClose,
  className,
  children,
}: LayoutContentProps) {
  const persistent = usePersistentSidebar();

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
  };

  if (persistent) {
    return (
      <div
        aria-label="Side Menu"
        role="presentation"
        aria-hidden={open ? "false" : "true"}
        data-hotkeys-keep-enabled={persistent ? "true" : "m"}
        className={clsx(
          "fixed top-0 bottom-0 left-0 hidden xl:block overflow-y-auto overflow-x-hidden transition-all duration-225 ease-out w-[320px] border-r bg-background",
          open && "translate-x-0",
          !open && "-translate-x-320",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <Sheet
      aria-label="Side Menu"
      data-hotkeys-keep-enabled={persistent ? "true" : "m"}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SheetContent side="left">{children}</SheetContent>
    </Sheet>
  );
}

export const LayoutContent = forwardRef<HTMLDivElement, LayoutContentProps>(
  ({ open, children }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "overflow-y-auto flex-auto xl:flex-grow",
          open && `xl:ml-[320px] xl:duration-225 xl:ease-out`,
          !open && "xl:ml-0 xl:duration-195 xl:ease-in",
        )}
      >
        {children}
      </div>
    );
  },
);
