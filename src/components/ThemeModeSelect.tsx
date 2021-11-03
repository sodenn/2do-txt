import { MenuItem, Select } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { ThemeMode, useAppTheme } from "../data/AppThemeContext";

const ThemeModeSelect = () => {
  const { t } = useTranslation();
  const { selectedMode, setSelectedMode } = useAppTheme();
  return (
    <Select
      fullWidth
      size="small"
      value={selectedMode}
      onChange={(event) => setSelectedMode(event.target.value as ThemeMode)}
    >
      <MenuItem value="light">{t("Light")}</MenuItem>
      <MenuItem value="dark">{t("Dark")}</MenuItem>
      <MenuItem value="system">{t("System")}</MenuItem>
    </Select>
  );
};

export default ThemeModeSelect;
