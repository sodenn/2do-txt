import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { createRoot } from "react-dom/client";
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
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    load: "languageOnly",
    fallbackLng: "en",
    supportedLngs: ["en", "de"],
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

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
