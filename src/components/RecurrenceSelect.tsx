import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRecValueMatch } from "../utils/task";

interface RecurrenceSelectProps {
  value?: string;
  onChange?: (value: string | null) => void;
}

const RecurrenceSelect = (props: RecurrenceSelectProps) => {
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
    <Stack direction="row" spacing={1}>
      <FormControl fullWidth>
        <InputLabel id="recurrence-select">{t("Recurrence")}</InputLabel>
        <Select
          labelId="recurrence-select"
          aria-label="Select unit"
          displayEmpty
          input={<OutlinedInput label={t("Recurrence")} />}
          value={unit}
          onChange={(event) => handleChangeUnit(event.target.value)}
        >
          <MenuItem value="-">{t("No recurrence")}</MenuItem>
          <MenuItem value="d">{t("Days")}</MenuItem>
          <MenuItem value="b">{t("Business days")}</MenuItem>
          <MenuItem value="w">{t("Weeks")}</MenuItem>
          <MenuItem value="m">{t("Months")}</MenuItem>
          <MenuItem value="y">{t("Years")}</MenuItem>
        </Select>
      </FormControl>
      {unit !== "-" && (
        <OutlinedInput
          type="number"
          inputProps={{
            min: "1",
            step: "1",
            pattern: "[1-9]*",
            inputMode: "numeric",
            "aria-label": "Amount",
          }}
          value={amount}
          endAdornment={
            <InputAdornment position="end">
              <Tooltip enterTouchDelay={200} title={t("Strict recurrence")}>
                <IconButton
                  aria-label="Toggle strict mode"
                  onClick={() => handleChangeStrict(!strict)}
                  edge="end"
                >
                  {!strict && <AddCircleOutlineRoundedIcon />}
                  {strict && <AddCircleOutlinedIcon />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          }
          onChange={(event) => handleChangeAmount(event.target.value)}
        />
      )}
    </Stack>
  );
};

export default RecurrenceSelect;
