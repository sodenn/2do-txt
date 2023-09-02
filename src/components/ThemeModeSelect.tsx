import { ThemeMode, useThemeStore } from "@/stores/theme-store";
import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";

export function ThemeModeSelect() {
  const { t } = useTranslation();
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  return (
    <Select
      fullWidth
      size="small"
      value={themeMode}
      inputProps={{ "aria-label": "Select theme mode" }}
      onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
    >
      <MenuItem value="light" aria-label="Light">
        {t("Light")}
      </MenuItem>
      <MenuItem value="dark" aria-label="Dark">
        {t("Dark")}
      </MenuItem>
      <MenuItem value="system" aria-label="System">
        {t("System")}
      </MenuItem>
    </Select>
  );
}
