import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { initReactI18next } from "react-i18next";
import "typeface-roboto";
import App from "./App";
import "./index.css";
import { formatLocaleDate } from "./utils/date";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    backend: {
      loadPath: `${process.env.PUBLIC_URL}/locales/{{lng}}/{{ns}}.json`,
    },
    load: "languageOnly",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (value instanceof Date && format === "date") {
          return formatLocaleDate(value, lng);
        }
        return value;
      },
    },
  });

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
