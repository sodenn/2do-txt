import { MaterialTheme } from "@/components/MaterialTheme";
import useMediaQuery from "@/utils/useMediaQuery";
import {
  Button,
  FormControl,
  FormLabel,
  IconButton,
  IconButtonProps,
  Input,
  InputProps,
  Stack,
} from "@mui/joy";
import {
  BaseSingleInputFieldProps,
  DatePicker,
  DatePickerProps,
  DateValidationError,
  FieldSection,
  FieldSelectedSections,
  LocalizationProvider,
  PickersActionBarProps,
  UseDateFieldProps,
  deDE,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDateField } from "@mui/x-date-pickers/DateField/useDateField";
import { useLocaleText } from "@mui/x-date-pickers/internals";
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

interface JoyDateFieldProps
  extends UseDateFieldProps<Date>,
    BaseSingleInputFieldProps<
      Date | null,
      Date,
      FieldSection,
      DateValidationError
    > {}

interface JoyFieldProps extends InputProps {
  label?: React.ReactNode;
  InputProps?: {
    ref?: React.Ref<any>;
    endAdornment?: React.ReactNode;
    startAdornment?: React.ReactNode;
  };
  formControlSx?: InputProps["sx"];
  inputProps?: any;
}

type JoyFieldComponent = ((
  props: JoyFieldProps & React.RefAttributes<HTMLDivElement>,
) => React.JSX.Element) & { propTypes?: any };

const JoyField = forwardRef<HTMLInputElement, JoyFieldProps>(
  (props, inputRef) => {
    const {
      disabled,
      id,
      label,
      inputProps,
      // @ts-ignore
      InputProps: { ref: containerRef, startAdornment, endAdornment } = {},
      formControlSx,
      ...other
    } = props;
    return (
      <FormControl
        disabled={disabled}
        id={id}
        sx={[
          {
            flexGrow: 1,
          },
          ...(Array.isArray(formControlSx) ? formControlSx : [formControlSx]),
        ]}
        ref={containerRef}
      >
        <FormLabel>{label}</FormLabel>
        <Input
          disabled={disabled}
          slotProps={{ input: { ref: inputRef, ...inputProps } }}
          startDecorator={startAdornment}
          endDecorator={endAdornment}
          {...other}
        />
      </FormControl>
    );
  },
) as JoyFieldComponent;

function JoyDateField(props: JoyDateFieldProps) {
  const {
    inputRef: externalInputRef,
    slots,
    slotProps,
    ...textFieldProps
  } = props;

  const response = useDateField({
    props: textFieldProps,
    inputRef: externalInputRef,
  });

  return <JoyField {...response} />;
}
function JoyOpenPickerButton(props: IconButtonProps) {
  return <IconButton {...props} variant="plain" color="neutral" />;
}

function JoyActionBar(props: PickersActionBarProps) {
  const { onClear, onAccept, actions, className } = props;
  const localeText = useLocaleText();

  if (actions == null || actions.length === 0) {
    return null;
  }

  const menuItems = actions?.map((actionType) => {
    switch (actionType) {
      case "clear":
        return (
          <Button size="sm" variant="solid" onClick={onClear} key={actionType}>
            {localeText.clearButtonLabel}
          </Button>
        );
      case "accept":
        return (
          <Button size="sm" variant="solid" onClick={onAccept} key={actionType}>
            {localeText.okButtonLabel}
          </Button>
        );
      default:
        return null;
    }
  });

  return (
    <Stack
      sx={{ px: 2, pb: 2 }}
      justifyContent="end"
      direction="row"
      spacing={1}
      className={className}
    >
      {menuItems}
    </Stack>
  );
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
    <MaterialTheme>
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
          slots={{
            field: JoyDateField,
            // @ts-ignore
            openPickerButton: JoyOpenPickerButton,
            actionBar: JoyActionBar,
          }}
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
            field: () => ({
              inputProps: {
                // @ts-ignore
                "data-testid": `${ariaLabel} textfield`,
                "aria-label": ariaLabel,
              },
            }),
            openPickerButton: {
              // @ts-ignore
              "data-testid": `${ariaLabel} pickerbutton`,
            },
            actionBar: {
              actions: desktop ? ["clear"] : ["clear", "accept"],
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
    </MaterialTheme>
  );
});
