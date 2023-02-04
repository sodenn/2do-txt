import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSideSheet } from "../data/SideSheetContext";

const SideSheetButton = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down("lg"));
  const { sideSheetOpen, toggleSideSheet } = useSideSheet();

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
