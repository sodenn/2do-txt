import { useMediaQuery } from "@mui/material";
import {
  DatePicker,
  DatePickerProps,
  LocalizationProvider,
  deDE,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { isAfter, isBefore, isValid, Locale } from "date-fns";
import deLocale from "date-fns/locale/de";
import enLocale from "date-fns/locale/en-US";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

const localeMap: Record<string, Locale> = {
  en: enLocale,
  de: deLocale,
};

type LocalizationDatePickerProps = DatePickerProps<Date> & {
  ariaLabel?: string;
};

const minDate = new Date("1900-01-01T00:00:00.000");
const maxDate = new Date("2099-12-31T00:00:00.000");

function isValidDate(date: Date) {
  return isValid(date) && isAfter(date, minDate) && isBefore(date, maxDate);
}

const LocalizationDatePicker = forwardRef<
  HTMLInputElement,
  LocalizationDatePickerProps
>((props, ref) => {
  const { value = null, ariaLabel, onChange, ...rest } = props;
  const desktop = useMediaQuery("@media (pointer: fine)");

  const {
    i18n: { resolvedLanguage },
  } = useTranslation();

  const handleChange: DatePickerProps<Date>["onChange"] = (value, context) => {
    if (!value || isValidDate(value)) {
      onChange?.(value, context);
    }
  };

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
        minDate={minDate}
        maxDate={maxDate}
        onChange={handleChange}
        ref={ref}
        value={value}
        slotProps={{
          textField: (props) => ({
            fullWidth: true,
            inputProps: {
              ...props.inputProps,
              "aria-label": ariaLabel,
            },
          }),
          actionBar: {
            actions: desktop ? ["clear"] : ["accept", "cancel", "clear"],
          },
          popper: {
            modifiers: [
              {
                name: "flip",
                options: {
                  altBoundary: false,
                  fallbackPlacements: ["right", "left"],
                },
              },
            ],
          },
        }}
      />
    </LocalizationProvider>
  );
});

export default LocalizationDatePicker;
