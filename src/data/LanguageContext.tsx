import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContext } from "../utils/Context";
import { useStorage } from "../utils/storage";

export type Language = "de" | "en";

const [LanguageContextProvider, useLanguage] = createContext(() => {
  const { i18n } = useTranslation();
  const { getStorageItem, setStorageItem } = useStorage();
  const [language, setLanguage] = useState(i18n.resolvedLanguage || "en");

  const changeLanguage = useCallback(
    (language: Language) => {
      if (language && i18n.resolvedLanguage !== language) {
        setLanguage(language);
        i18n.changeLanguage(language);
        setStorageItem("language", language);
      }
    },
    [i18n, setStorageItem]
  );

  useEffect(() => {
    getStorageItem("language").then((value) => {
      changeLanguage(value as Language);
    });
  }, [getStorageItem, changeLanguage]);

  return {
    language,
    changeLanguage,
  };
});

export { LanguageContextProvider, useLanguage };
