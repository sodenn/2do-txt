import { Language, useSettingsStore } from "@/stores/settings-store";
import { Option, Select } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function LanguageSelect() {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const changeLanguage = useSettingsStore((state) => state.changeLanguage);
  return (
    <Select
      value={language}
      onChange={(_, value) => changeLanguage(value as Language)}
      slotProps={{
        button: {
          "aria-label": "Select language",
        },
      }}
    >
      <Option value="en" aria-label="English">
        {t("English")}
      </Option>
      <Option value="de" aria-label="German">
        {t("German")}
      </Option>
    </Select>
  );
}
