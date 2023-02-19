import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import useSettings, { Language } from "../stores/settings-store";

const LanguageSelect = () => {
  const { t } = useTranslation();
  const language = useSettings((state) => state.language);
  const changeLanguage = useSettings((state) => state.changeLanguage);
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
