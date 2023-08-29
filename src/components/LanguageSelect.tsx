import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import useSettingsStore, { Language } from "@/stores/settings-store";

export default function LanguageSelect() {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const changeLanguage = useSettingsStore((state) => state.changeLanguage);
  return (
    <Select
      fullWidth
      size="small"
      value={language}
      inputProps={{ "aria-label": "Select language" }}
      onChange={(event) => changeLanguage(event.target.value as Language)}
    >
      <MenuItem value="en" aria-label="English">
        {t("English")}
      </MenuItem>
      <MenuItem value="de" aria-label="German">
        {t("German")}
      </MenuItem>
    </Select>
  );
}
