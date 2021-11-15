import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Language, useLanguage } from "../data/LanguageContext";

const LanguageSelect = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  return (
    <Select
      fullWidth
      size="small"
      value={language}
      onChange={(event) => changeLanguage(event.target.value as Language)}
    >
      <MenuItem value="en">{t("English")}</MenuItem>
      <MenuItem value="de">{t("German")}</MenuItem>
    </Select>
  );
};

export default LanguageSelect;
