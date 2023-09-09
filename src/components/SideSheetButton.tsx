import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useHotkeys } from "@/utils/useHotkeys";
import useMediaQuery from "@/utils/useMediaQuery";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, useTheme } from "@mui/joy";
import { useMemo } from "react";

export function SideSheetButton() {
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down("lg"));
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const toggleSideSheet = useSideSheetStore((state) => state.toggleSideSheet);

  const hotkeys = useMemo(() => ({ m: toggleSideSheet }), [toggleSideSheet]);

  useHotkeys(hotkeys);

  return (
    <IconButton
      tabIndex={-1}
      onClick={toggleSideSheet}
      size="md"
      variant="outlined"
      aria-label="Toggle menu"
    >
      {(!sideSheetOpen || md) && <MenuIcon />}
      {sideSheetOpen && !md && <ChevronLeftIcon />}
    </IconButton>
  );
}
