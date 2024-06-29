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
      variant="secondary"
      size="icon"
      aria-label="Toggle menu"
    >
      <MenuIcon
        className={cn(
          "h-4 w-4 inline-block",
          sideSheetOpen ? "xl:hidden" : "xl:inline-block",
        )}
      />
      <ChevronLeftIcon
        className={cn(
          "h-4 w-4 hidden",
          sideSheetOpen ? "xl:inline-block" : "xl:hidden",
        )}
      />
    </Button>
  );
}
// sx={{ display: {xs: "inline-block", lg: "none"} }}
