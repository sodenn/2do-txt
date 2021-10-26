import { Button, ButtonGroup } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../data/AppContext";

const LanguageButton = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useAppContext();
  return (
    <ButtonGroup variant="outlined" fullWidth>
      <Button
        variant={language === "en" ? "contained" : "outlined"}
        onClick={() => changeLanguage("en")}
      >
        {t("English")}
      </Button>
      <Button
        variant={language === "de" ? "contained" : "outlined"}
        onClick={() => changeLanguage("de")}
      >
        {t("German")}
      </Button>
    </ButtonGroup>
  );
};

export default LanguageButton;
