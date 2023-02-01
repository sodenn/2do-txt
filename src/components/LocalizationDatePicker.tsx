import { TextField, useMediaQuery } from "@mui/material";
import {
  DatePicker,
  DatePickerProps,
  deDE,
  LocalizationProvider,
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
    i18n: { resolvedLanguage },
  } = useTranslation();

  return (
    <LocalizationProvider
      localeText={
        resolvedLanguage === "de"
          ? deDE.components.MuiLocalizationProvider.defaultProps.localeText
          : undefined
      }
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
