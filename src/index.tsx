import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import React from "react";
import ReactDOM from "react-dom";
import { initReactI18next } from "react-i18next";
import "typeface-roboto";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { formatLocaleDate } from "./utils/date";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
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
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
