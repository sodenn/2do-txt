import { Button } from "@/components/ui/button";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { cn } from "@/utils/tw-utils";
import { useHotkeys } from "@/utils/useHotkeys";
import { ChevronLeftIcon, MenuIcon } from "lucide-react";

export function SideSheetButton() {
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const toggleSideSheet = useSideSheetStore((state) => state.toggleSideSheet);

  useHotkeys({ m: toggleSideSheet });

  return (
    <Button
      tabIndex={-1}
      onClick={toggleSideSheet}
      variant="outline"
      size="icon"
      aria-label="Toggle menu"
    >
      <MenuIcon
        className={cn(
          "inline-block h-4 w-4",
          sideSheetOpen ? "xl:hidden" : "xl:inline-block",
        )}
      />
      <ChevronLeftIcon
        className={cn(
          "hidden h-4 w-4",
          sideSheetOpen ? "xl:inline-block" : "xl:hidden",
        )}
      />
    </Button>
  );
}
