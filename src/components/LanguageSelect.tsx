import { MenuItem, Select } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { Language, useAppContext } from "../data/AppContext";

const LanguageSelect = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useAppContext();
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
