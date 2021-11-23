import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSideSheet } from "../data/SideSheetContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const SideSheetButton = () => {
  const { t } = useTranslation();
  const { setSideSheetOpen } = useSideSheet();

  useAddShortcutListener(() => {
    setSideSheetOpen(true);
  }, "m");

  return (
    <Tooltip
      disableTouchListener
      title={
        <>
          {t("Menu")}{" "}
          <Box component="span" sx={{ ml: 0.5 }}>
            <Kbd>M</Kbd>
          </Box>
        </>
      }
    >
      <IconButton
        tabIndex={-1}
        onClick={() => setSideSheetOpen(true)}
        size="large"
        edge="start"
        color="inherit"
        aria-label="Menu"
      >
        <MenuIcon />
      </IconButton>
    </Tooltip>
  );
};

export default SideSheetButton;
