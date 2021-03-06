import { DatePicker, DatePickerProps } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import { TextField, useMediaQuery } from "@mui/material";
import { Locale } from "date-fns";
import deLocale from "date-fns/locale/de";
import enLocale from "date-fns/locale/en-US";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

const localeMap: Record<string, Locale> = {
  en: enLocale,
  de: deLocale,
};

const maskMap: Record<string, string> = {
  en: "__/__/____",
  de: "__.__.____",
};

type LocalizationDatePickerProps = Omit<
  DatePickerProps<Date>,
  "renderInput" | "date" | "openPicker" | "rawValue"
> & { ariaLabel?: string };

const LocalizationDatePicker = forwardRef<
  HTMLInputElement,
  LocalizationDatePickerProps
>((props, ref) => {
  const { value = null, ariaLabel, onChange, ...rest } = props;
  const desktop = useMediaQuery("@media (pointer: fine)");

  const handleChange = (date: Date | null, keyboardInputValue?: string) => {
    if (desktop) {
      onChange(date, keyboardInputValue);
    }
  };

  const handleAccept = (date: Date | null) => {
    if (!desktop) {
      onChange(date);
    }
  };

  const {
    t,
    i18n: { resolvedLanguage },
  } = useTranslation();

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      locale={localeMap[resolvedLanguage]}
    >
      {/** @ts-ignore */}
      <DatePicker
        {...rest}
        onChange={handleChange}
        onAccept={handleAccept}
        ref={ref}
        value={value}
        clearable
        allowSameDateSelection
        toolbarTitle={
          resolvedLanguage !== "en"
            ? (t("datePicker.toolbarTitle") as any)
            : undefined
        }
        todayText={
          resolvedLanguage !== "en"
            ? (t("datePicker.todayText") as any)
            : undefined
        }
        clearText={
          resolvedLanguage !== "en"
            ? (t("datePicker.clearText") as any)
            : undefined
        }
        cancelText={
          resolvedLanguage !== "en"
            ? (t("datePicker.cancelText") as any)
            : undefined
        }
        okText={
          resolvedLanguage !== "en"
            ? (t("datePicker.okText") as any)
            : undefined
        }
        mask={maskMap[resolvedLanguage]}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            inputProps={{ ...params.inputProps, "aria-label": ariaLabel }}
          />
        )}
      />
    </LocalizationProvider>
  );
});

export default LocalizationDatePicker;
