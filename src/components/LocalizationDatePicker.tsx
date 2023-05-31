import { TextField, useMediaQuery } from "@mui/material";
import {
  DatePicker,
  DatePickerProps,
  LocalizationProvider,
  deDE,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Locale } from "date-fns";
import deLocale from "date-fns/locale/de";
import enLocale from "date-fns/locale/en-US";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

const localeMap: Record<string, Locale> = {
  en: enLocale,
  de: deLocale,
};

const getLocalText = (language: string) =>
  language === "de"
    ? deDE.components.MuiLocalizationProvider.defaultProps.localeText
    : undefined;

type LocalizationDatePickerProps = Omit<
  DatePickerProps<Date | undefined, Date>,
  "renderInput" | "date" | "openPicker" | "rawValue"
> & { ariaLabel?: string };

const LocalizationDatePicker = forwardRef<
  HTMLInputElement,
  LocalizationDatePickerProps
>((props, ref) => {
  const { value = null, ariaLabel, onChange, ...rest } = props;
  const desktop = useMediaQuery("@media (pointer: fine)");

  const {
    i18n: { resolvedLanguage = "en" },
  } = useTranslation();

  return (
    <LocalizationProvider
      localeText={getLocalText(resolvedLanguage)}
      dateAdapter={AdapterDateFns}
      adapterLocale={localeMap[resolvedLanguage]}
    >
      <DatePicker
        {...rest}
        onChange={onChange}
        ref={ref}
        value={value}
        PopperProps={{
          modifiers: [
            {
              name: "flip",
              options: {
                altBoundary: false,
                fallbackPlacements: ["right", "left"],
              },
            },
          ],
        }}
        componentsProps={
          desktop
            ? {
                actionBar: { actions: ["clear"] },
              }
            : {
                actionBar: { actions: ["accept", "cancel", "clear"] },
              }
        }
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
