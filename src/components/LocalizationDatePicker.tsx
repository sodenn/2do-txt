import { useMediaQuery } from "@mui/material";
import {
  DatePicker,
  DatePickerProps,
  FieldSelectedSections,
  LocalizationProvider,
  deDE,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Locale, isAfter, isBefore, isValid } from "date-fns";
import deLocale from "date-fns/locale/de";
import enLocale from "date-fns/locale/en-US";
import { KeyboardEvent, MouseEvent, forwardRef, useState } from "react";
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

export const LocalizationDatePicker = forwardRef<
  HTMLInputElement,
  LocalizationDatePickerProps
>((props, ref) => {
  const { value = null, ariaLabel, onChange, ...rest } = props;
  const desktop = useMediaQuery("@media (pointer: fine)");
  const [selectedSections, setSelectedSections] =
    useState<FieldSelectedSections>(null);

  const handleDoubleClick = (event: MouseEvent) => {
    if (!desktop) {
      return;
    }
    (event.target as any)?.focus();
    setSelectedSections("all");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!desktop) {
      return;
    }
    if (event.key === "Backspace" && selectedSections === "all") {
      setSelectedSections(0);
    }
    if (event.key === "Backspace" && typeof selectedSections === "number") {
      setSelectedSections(Math.max(selectedSections - 1, 0));
    }
  };

  const {
    i18n: { language },
  } = useTranslation();

  const handleChange: DatePickerProps<Date>["onChange"] = (value, context) => {
    if (!value || isValidDate(value)) {
      onChange?.(value, context);
    }
  };

  return (
    <LocalizationProvider
      localeText={
        language === "de"
          ? deDE.components.MuiLocalizationProvider.defaultProps.localeText
          : undefined
      }
      dateAdapter={AdapterDateFns}
      adapterLocale={localeMap[language]}
    >
      <DatePicker
        {...rest}
        minDate={minDate}
        maxDate={maxDate}
        onChange={handleChange}
        ref={ref}
        value={value}
        selectedSections={selectedSections}
        onSelectedSectionsChange={setSelectedSections}
        slotProps={{
          textField: (props) => ({
            fullWidth: true,
            inputProps: {
              ...props.inputProps,
              "data-testid": `${ariaLabel} textfield`,
              "aria-label": ariaLabel,
            },
            onDoubleClick: handleDoubleClick,
            onKeyDown: handleKeyDown,
          }),
          openPickerButton: {
            // @ts-ignore
            "data-testid": `${ariaLabel} pickerbutton`,
          },
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
