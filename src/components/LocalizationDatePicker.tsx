import { useMediaQuery } from "@mui/material";
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

type LocalizationDatePickerProps = DatePickerProps<Date> & {
  ariaLabel?: string;
};

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
        slotProps={{
          textField: (props) => ({
            fullWidth: true,
            inputProps: {
              "aria-label": ariaLabel,
              "data-testid": ariaLabel,
              ...props.inputProps,
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
