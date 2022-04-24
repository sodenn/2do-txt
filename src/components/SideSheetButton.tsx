import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSideSheet } from "../data/SideSheetContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const SideSheetButton = () => {
  const { t } = useTranslation();
  const { sideSheetOpen, setSideSheetOpen } = useSideSheet();

  useAddShortcutListener(() => setSideSheetOpen(!sideSheetOpen), "m", [
    sideSheetOpen,
  ]);

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
        onClick={() => setSideSheetOpen(!sideSheetOpen)}
        size="large"
        edge="start"
        color="inherit"
        aria-label="Menu"
      >
        {!sideSheetOpen && <MenuIcon />}
        {sideSheetOpen && <ChevronLeftIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default SideSheetButton;
