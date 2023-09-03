import { usePaletteMode } from "@/components/AppThemeProvider";
import { ThemeMode, useThemeStore } from "@/stores/theme-store";
import { Option, Select, SelectProps } from "@mui/joy";
import { useColorScheme as useJoyColorScheme } from "@mui/joy/styles/CssVarsProvider";
import { useColorScheme as useMaterialColorScheme } from "@mui/material/styles/CssVarsProvider";
import { useTranslation } from "react-i18next";

export function ThemeModeSelect() {
  const { t } = useTranslation();
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const { getPaletteMode } = usePaletteMode();
  const { setMode: setMaterialMode } = useMaterialColorScheme();
  const { setMode: setJoyMode } = useJoyColorScheme();

  const handleClick: SelectProps<ThemeMode>["onChange"] = (_, value) => {
    const newValue = value || "system";
    const paletteMode = getPaletteMode(newValue);
    setMaterialMode(paletteMode);
    setJoyMode(paletteMode);
    setThemeMode(newValue);
  };

  return (
    <Select
      value={themeMode}
      onChange={handleClick}
      slotProps={{
        button: {
          "aria-label": "Select theme mode",
        },
      }}
    >
      <Option value="light" aria-label="Light">
        {t("Light")}
      </Option>
      <Option value="dark" aria-label="Dark">
        {t("Dark")}
      </Option>
      <Option value="system" aria-label="System">
        {t("System")}
      </Option>
    </Select>
  );
}
