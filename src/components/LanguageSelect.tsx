import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Language, useSettings } from "../data/SettingsContext";

const LanguageSelect = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useSettings();
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
};

export default LanguageSelect;
