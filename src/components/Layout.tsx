import { useBreakpoint } from "@/components/Breakpoint";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { ScrollAreaProps } from "@radix-ui/react-scroll-area";
import clsx from "clsx";
import { HTMLAttributes, ReactNode } from "react";

interface HeaderContainerProps {
  open: boolean;
  children: ReactNode;
}

export interface LayoutSidebarProps extends HTMLAttributes<HTMLDivElement> {
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
        "flex-shrink-0 flex-grow-0 basis-auto xl:transition-all",
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
}: LayoutSidebarProps) {
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
          "fixed bottom-0 left-0 top-0 hidden w-[320px] overflow-y-auto overflow-x-hidden border-r bg-background transition-all duration-225 ease-out xl:block",
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

export function LayoutContent(props: ScrollAreaProps) {
  const setDivider = useScrollingStore((state) => state.setDivider);
  const sideSheetOpen = useSideSheetStore((state) => state.open);

  const handleScroll: ScrollAreaProps["onScroll"] = (event) => {
    const element = event.target as HTMLDivElement;
    setDivider(element.scrollTop > 10);
  };

  return (
    <ScrollArea
      onScroll={handleScroll}
      data-testid="page"
      id="scroll-container"
      className={clsx(
        "flex-auto overflow-y-auto xl:flex-grow",
        sideSheetOpen && `xl:ml-[320px] xl:duration-225 xl:ease-out`,
        !sideSheetOpen && "xl:ml-0 xl:duration-195 xl:ease-in",
      )}
      {...props}
    />
  );
}
