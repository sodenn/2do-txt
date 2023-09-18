import { ThemeMode, useThemeStore } from "@/stores/theme-store";
import { FormControl, FormLabel, Option, Select, SelectProps } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function ThemeModeSelect() {
  const { t } = useTranslation();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const handleClick: SelectProps<ThemeMode>["onChange"] = (_, value) => {
    const newValue = value || "system";
    setMode(newValue);
  };

  return (
    <FormControl>
      <FormLabel>{t("Appearance")}</FormLabel>
      <Select
        value={mode}
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
    </FormControl>
  );
}
