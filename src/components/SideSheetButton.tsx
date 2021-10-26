import MenuIcon from "@mui/icons-material/Menu";
import { IconButton } from "@mui/material";
import React from "react";
import { useAppContext } from "../data/AppContext";

const SideSheetButton = () => {
  const { setSideSheetOpen } = useAppContext();
  return (
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
  );
};

export default SideSheetButton;
