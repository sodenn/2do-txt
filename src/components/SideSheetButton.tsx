import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSideSheet } from "../data/SideSheetContext";
import Kbd from "./Kbd";

const SideSheetButton = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down("lg"));
  const { sideSheetOpen, toggleSideSheet } = useSideSheet();

  return (
    <Tooltip
      disableTouchListener
      title={
        <>
          {t("Menu")}
          <Box component="span" sx={{ ml: 0.5 }}>
            <Kbd>M</Kbd>
          </Box>
        </>
      }
    >
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
    </Tooltip>
  );
};

export default SideSheetButton;
