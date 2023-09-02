import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useHotkeys } from "@/utils/useHotkeys";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, useMediaQuery, useTheme } from "@mui/material";
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
      onClick={() => toggleSideSheet()}
      size="large"
      edge="start"
      color="inherit"
      aria-label="Toggle menu"
    >
      {(!sideSheetOpen || md) && <MenuIcon />}
      {sideSheetOpen && !md && <ChevronLeftIcon />}
    </IconButton>
  );
}
