import { useMediaQuery } from "@/utils/useMediaQuery";
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
  useClearableField,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  DateFieldSlotsComponent,
  DateFieldSlotsComponentsProps,
} from "@mui/x-date-pickers/DateField/DateField.types";
import { useDateField } from "@mui/x-date-pickers/DateField/useDateField";
import { useLocaleText } from "@mui/x-date-pickers/internals";
import { Locale, isAfter, isBefore, isValid } from "date-fns";
import deLocale from "date-fns/locale/de";
import enLocale from "date-fns/locale/en-US";
import { KeyboardEvent, MouseEvent, Ref, forwardRef, useState } from "react";
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

const JoyField = forwardRef(
  (props: JoyFieldProps, ref: React.Ref<HTMLDivElement>) => {
    const {
      disabled,
      id,
      label,
      inputProps,
      InputProps: { ref: containerRef, startAdornment, endAdornment } = {},
      formControlSx,
      endDecorator,
      startDecorator,
      slotProps,
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
        ref={ref}
      >
        <FormLabel>{label}</FormLabel>
        <Input
          ref={ref}
          disabled={disabled}
          endDecorator={
            <>
              {endAdornment}
              {endDecorator}
            </>
          }
          slotProps={{
            ...slotProps,
            input: { ref, ...inputProps },
            root: { ...slotProps?.root, ref: containerRef },
          }}
          {...other}
        />
      </FormControl>
    );
  },
) as JoyFieldComponent;

const JoyDateField = forwardRef(
  (props: JoyDateFieldProps, ref: Ref<HTMLDivElement>) => {
    const {
      inputRef: externalInputRef,
      slots,
      slotProps,
      ...textFieldProps
    } = props;

    const {
      onClear,
      clearable,
      ref: inputRef,
      ...fieldProps
    } = useDateField<Date, typeof textFieldProps>({
      props: textFieldProps,
      inputRef: externalInputRef,
    });

    /* If you don't need a clear button, you can skip the use of this hook */
    const { InputProps: ProcessedInputProps, fieldProps: processedFieldProps } =
      useClearableField<
        {}, // eslint-disable-line @typescript-eslint/ban-types
        typeof textFieldProps.InputProps,
        DateFieldSlotsComponent,
        DateFieldSlotsComponentsProps<Date>
      >({
        onClear,
        clearable,
        fieldProps,
        InputProps: fieldProps.InputProps,
        slots,
        slotProps,
      });

    return (
      <JoyField
        ref={ref}
        slotProps={{
          input: {
            ref: inputRef,
          },
        }}
        {...processedFieldProps}
        InputProps={ProcessedInputProps}
      />
    );
  },
);

function JoyClearButton(props: IconButtonProps) {
  return (
    <IconButton {...props} sx={{ mr: "4px" }} variant="plain" color="neutral" />
  );
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
          clearButton: JoyClearButton,
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
            clearable: true,
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
  );
});
