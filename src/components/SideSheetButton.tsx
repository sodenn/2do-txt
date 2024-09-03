import { Button } from "@/components/ui/button";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { PanelLeftIcon } from "lucide-react";

export function SideSheetButton() {
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
      <PanelLeftIcon className="h-4 w-4" />
    </Button>
  );
}
