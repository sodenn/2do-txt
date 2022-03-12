import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ThemeMode, useAppTheme } from "../data/AppThemeContext";

const ThemeModeSelect = () => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useAppTheme();
  return (
    <Select
      fullWidth
      size="small"
      value={themeMode}
      aria-label="Select theme mode"
      onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
    >
      <MenuItem value="light">{t("Light")}</MenuItem>
      <MenuItem value="dark">{t("Dark")}</MenuItem>
      <MenuItem value="system">{t("System")}</MenuItem>
    </Select>
  );
};

export default ThemeModeSelect;
