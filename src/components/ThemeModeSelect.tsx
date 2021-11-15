import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ThemeMode, useSettings } from "../data/SettingsContext";

const ThemeModeSelect = () => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useSettings();
  return (
    <Select
      fullWidth
      size="small"
      value={themeMode}
      onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
    >
      <MenuItem value="light">{t("Light")}</MenuItem>
      <MenuItem value="dark">{t("Dark")}</MenuItem>
      <MenuItem value="system">{t("System")}</MenuItem>
    </Select>
  );
};

export default ThemeModeSelect;
