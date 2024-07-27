import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Language, useSettingsStore } from "@/stores/settings-store";
import { useTranslation } from "react-i18next";

export function LanguageSelect() {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const changeLanguage = useSettingsStore((state) => state.changeLanguage);
  return (
    <div className="space-y-2">
      <div className="font-semibold">{t("Language")}</div>
      <Select
        value={language}
        onValueChange={(value) => changeLanguage(value as Language)}
      >
        <SelectTrigger aria-label="Select language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en" aria-label="English">
            {t("English")}
          </SelectItem>
          <SelectItem value="de" aria-label="German">
            {t("German")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
