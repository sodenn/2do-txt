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
  useClearableField,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { useDateField } from "@mui/x-date-pickers/DateField/useDateField";
import { useLocaleText } from "@mui/x-date-pickers/internals";
import { deDE } from "@mui/x-date-pickers/locales";
import { Locale, isAfter, isBefore, isValid } from "date-fns";
import { de } from "date-fns/locale/de";
import { enUS } from "date-fns/locale/en-US";
import { ReactNode, Ref, RefAttributes, forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";

const localeMap: Record<string, Locale> = {
  en: enUS,
  de,
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
  extends UseDateFieldProps<Date, false>,
    BaseSingleInputFieldProps<
      Date | null,
      Date,
      FieldSection,
      false,
      DateValidationError
    > {}

interface JoyFieldProps extends InputProps {
  label?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  enableAccessibleFieldDOMStructure?: boolean;
  InputProps?: {
    ref?: Ref<any>;
    endAdornment?: ReactNode;
    startAdornment?: ReactNode;
  };
  formControlSx?: InputProps["sx"];
}

type JoyFieldComponent = ((
  props: JoyFieldProps & RefAttributes<HTMLDivElement>,
) => JSX.Element) & { propTypes?: any };

const JoyField = forwardRef(
  (props: JoyFieldProps, ref: React.Ref<HTMLDivElement>) => {
    const {
      // Should be ignored
      enableAccessibleFieldDOMStructure,

      disabled,
      id,
      label,
      InputProps: { ref: containerRef, endAdornment } = {},
      formControlSx,
      endDecorator,
      startDecorator,
      slotProps,
      inputRef,
      ...other
    } = props;

    return (
      <FormControl
        disabled={disabled}
        id={id}
        sx={[
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
            root: { ...slotProps?.root, ref: containerRef },
            input: { ...slotProps?.input, ref: inputRef },
          }}
          {...other}
        />
      </FormControl>
    );
  },
) as JoyFieldComponent;

const JoyDateField = forwardRef(
  (props: JoyDateFieldProps, ref: Ref<HTMLDivElement>) => {
    const { slots, slotProps, ...textFieldProps } = props;

    const fieldResponse = useDateField<Date, false, typeof textFieldProps>({
      ...textFieldProps,
      enableAccessibleFieldDOMStructure: false,
    });

    /* If you don't need a clear button, you can skip the use of this hook */
    const processedFieldProps = useClearableField({
      ...fieldResponse,
      slots,
      slotProps,
    });

    return <JoyField ref={ref} {...processedFieldProps} />;
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
          // @ts-ignore
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
          }),
          field: () => ({
            clearable: true,
            inputProps: {
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
