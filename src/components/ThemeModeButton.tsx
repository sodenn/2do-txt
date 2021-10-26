import NightlightOutlinedIcon from "@mui/icons-material/NightlightOutlined";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { Button, ButtonGroup } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../data/AppThemeContext";

const ThemeModeButton = () => {
  const { t } = useTranslation();
  const { selectedMode, setSelectedMode } = useAppTheme();
  return (
    <ButtonGroup variant="outlined" fullWidth>
      <Button
        variant={selectedMode === "light" ? "contained" : "outlined"}
        onClick={() => setSelectedMode("light")}
        startIcon={<WbSunnyIcon />}
      >
        {t("Light")}
      </Button>
      <Button
        variant={selectedMode === "system" ? "contained" : "outlined"}
        onClick={() => setSelectedMode("system")}
        startIcon={<SettingsBrightnessOutlinedIcon />}
      >
        {t("System")}
      </Button>
      <Button
        variant={selectedMode === "dark" ? "contained" : "outlined"}
        onClick={() => setSelectedMode("dark")}
        startIcon={<NightlightOutlinedIcon />}
      >
        {t("Dark")}
      </Button>
    </ButtonGroup>
  );
};

export default ThemeModeButton;
