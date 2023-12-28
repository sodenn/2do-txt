import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useHotkeys } from "@/utils/useHotkeys";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton } from "@mui/joy";

export function SideSheetButton() {
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const toggleSideSheet = useSideSheetStore((state) => state.toggleSideSheet);

  useHotkeys({ m: toggleSideSheet });

  return (
    <IconButton
      tabIndex={-1}
      onClick={toggleSideSheet}
      size="md"
      variant="soft"
      aria-label="Toggle menu"
    >
      <MenuIcon
        sx={{
          display: {
            xs: "inline-block",
            lg: sideSheetOpen ? "none" : "inline-block",
          },
        }}
      />
      <ChevronLeftIcon
        sx={{
          display: { xs: "none", lg: sideSheetOpen ? "inline-block" : "none" },
        }}
      />
    </IconButton>
  );
}
// sx={{ display: {xs: "inline-block", lg: "none"} }}
