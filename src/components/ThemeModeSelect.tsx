import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeMode, useThemeStore } from "@/stores/theme-store";
import { useTranslation } from "react-i18next";

export function ThemeModeSelect() {
  const { t } = useTranslation();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const handleClick = (value: ThemeMode) => {
    const newValue = value || "system";
    setMode(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="font-semibold">{t("Theme")}</div>
      <Select
        value={mode}
        onValueChange={(value) => handleClick(value as ThemeMode)}
      >
        <SelectTrigger aria-label="Select theme mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">{t("Light")}</SelectItem>
          <SelectItem value="dark">{t("Dark")}</SelectItem>
          <SelectItem value="system">{t("System")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
