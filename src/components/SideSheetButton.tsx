import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, useMediaQuery, useTheme } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useSideSheetStore from "../stores/side-sheet-store";
import { useHotkeys } from "../utils/useHotkeys";

const SideSheetButton = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down("lg"));
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const toggleSideSheet = useSideSheetStore((state) => state.toggleSideSheet);

  const shortcutListeners = useMemo(
    () => ({ m: toggleSideSheet }),
    [toggleSideSheet]
  );

  useHotkeys(shortcutListeners);

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
};

export default SideSheetButton;
