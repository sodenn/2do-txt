import { useBreakpoint } from "@/components/Breakpoint";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HiddenSheetHeader,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { cn } from "@/utils/tw-utils";
import { ScrollAreaProps } from "@radix-ui/react-scroll-area";
import clsx from "clsx";
import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";

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
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const handleTransitionStart = () => {
      setHidden(false);
    };
    const handleTransitionEnd = () => {
      setHidden(!open && true);
    };
    element.addEventListener("transitionstart", handleTransitionStart);
    element.addEventListener("transitionend", handleTransitionEnd);
    return () => {
      element.removeEventListener("transitionstart", handleTransitionStart);
      element.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [open]);

  if (persistent) {
    return (
      <div
        ref={ref}
        aria-label="Side Menu"
        role="presentation"
        aria-hidden={open ? "false" : "true"}
        data-hotkeys-keep-enabled={persistent ? "true" : "m"}
        className={cn(
          "fixed bottom-0 left-0 top-0 hidden w-[320px] border-r bg-background transition-all duration-225 ease-out xl:block",
          open && "translate-x-0",
          !open && "-translate-x-320",
          className,
        )}
      >
        <div className={cn("h-screen", hidden && "hidden xl:hidden")}>
          {children}
        </div>
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
      <SheetContent className="p-0" side="left">
        <HiddenSheetHeader>
          <SheetTitle>Side Sheet</SheetTitle>
          <SheetDescription></SheetDescription>
        </HiddenSheetHeader>
        {children}
      </SheetContent>
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
