import { getRecValueMatch } from "@/utils/task";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import {
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Option,
  Select,
  Stack,
  Tooltip,
} from "@mui/joy";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface RecurrenceSelectProps {
  value?: string;
  onChange?: (value: string | null) => void;
}

export function RecurrenceSelect(props: RecurrenceSelectProps) {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const [strict, setStrict] = useState(false);
  const [unit, setUnit] = useState("-");
  const [amount, setAmount] = useState("1");

  useEffect(() => {
    const match = getRecValueMatch(value);
    if (match && match.length > 3) {
      setStrict(match[1] === "+");
      setAmount(match[2]);
      setUnit(match[3]);
    } else {
      setStrict(false);
      setAmount("1");
      setUnit("-");
    }
  }, [value]);

  const handleChangeUnit = (value: string | null) => {
    setUnit(value || "-");
    if (value === "-") {
      setAmount("1");
      setStrict(false);
      handleChange("-", "1", false);
    } else {
      handleChange(value || "-", amount, strict);
    }
  };

  const handleChangeAmount = (value: string) => {
    setAmount(value);
    handleChange(unit, value || "1", strict);
  };

  const handleChangeStrict = (value: boolean) => {
    setStrict(value);
    handleChange(unit, amount, value);
  };

  const handleChange = (unit: string, amount: string, strict: boolean) => {
    if (unit === "-") {
      onChange?.(null);
    } else {
      const value = (strict ? "+" : "") + amount + unit;
      onChange?.(value);
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="end">
      <FormControl sx={{ flex: 1 }}>
        <FormLabel>{t("Recurrence")}</FormLabel>
        <Select
          value={unit}
          onChange={(_, value) => handleChangeUnit(value)}
          slotProps={{
            listbox: {
              "aria-label": "Select unit",
            },
          }}
        >
          <Option value="-">{t("No recurrence")}</Option>
          <Option value="d">{t("Days")}</Option>
          <Option value="b">{t("Business days")}</Option>
          <Option value="w">{t("Weeks")}</Option>
          <Option value="m">{t("Months")}</Option>
          <Option value="y">{t("Years")}</Option>
        </Select>
      </FormControl>
      {unit !== "-" && (
        <Input
          type="number"
          value={amount}
          sx={{ maxWidth: 120 }}
          slotProps={{
            input: {
              role: "spinbutton",
              min: "1",
              step: "1",
              pattern: "[1-9]*",
              inputMode: "numeric",
              "aria-label": "Amount",
            },
          }}
          endDecorator={
            <Tooltip
              disableTouchListener={false}
              enterTouchDelay={200}
              title={t("Strict recurrence")}
            >
              <IconButton
                aria-label="Toggle strict mode"
                onClick={() => handleChangeStrict(!strict)}
              >
                {!strict && <AddCircleOutlineRoundedIcon />}
                {strict && <AddCircleIcon />}
              </IconButton>
            </Tooltip>
          }
          onChange={(event) => handleChangeAmount(event.target.value)}
        />
      )}
    </Stack>
  );
}
