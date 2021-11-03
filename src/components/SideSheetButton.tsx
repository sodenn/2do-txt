import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../data/AppContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const SideSheetButton = () => {
  const { t } = useTranslation();
  const { setSideSheetOpen } = useAppContext();

  useAddShortcutListener(() => {
    setSideSheetOpen(true);
  }, ["m"]);

  return (
    <Tooltip
      title={
        <>
          {t("Menu")} <Kbd>M</Kbd>
        </>
      }
    >
      <IconButton
        tabIndex={-1}
        onClick={() => setSideSheetOpen(true)}
        size="large"
        edge="start"
        color="inherit"
        aria-label="Open side sheet"
      >
        <MenuIcon />
      </IconButton>
    </Tooltip>
  );
};

export default SideSheetButton;
