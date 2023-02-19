import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import useTheme, { ThemeMode } from "../stores/theme-store";

const ThemeModeSelect = () => {
  const { t } = useTranslation();
  const themeMode = useTheme((state) => state.mode);
  const setThemeMode = useTheme((state) => state.setThemeMode);
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
};

export default ThemeModeSelect;
