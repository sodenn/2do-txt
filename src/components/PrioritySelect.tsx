import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  PaperProps,
  Select,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { hasTouchScreen } from "@/native-api/platform";

const options = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const selectOptions = ["", ...options];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP,
    },
  },
};

interface PrioritySelectProps {
  value?: string;
  onChange?: (priority: any) => void;
}

function PaperComponent(props: PaperProps) {
  return <Paper {...props} elevation={8} />;
}

export default function PrioritySelect(props: PrioritySelectProps) {
  const { value: initialValue, onChange } = props;
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue ?? null);
  const [autoSelect, setAutoSelect] = useState(false);
  const touchScreen = hasTouchScreen();

  const handleChange = (val: string | null) => {
    onChange?.(val);
    setValue(val);
  };

  const handleInputChange = (val: string) => {
    setAutoSelect(options.includes(val.toUpperCase()));
  };

  return (
    <>
      {!touchScreen && (
        <Autocomplete
          PaperComponent={PaperComponent}
          autoSelect={autoSelect}
          autoHighlight={autoSelect}
          value={value}
          options={options}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("Priority")}
              inputProps={{
                ...params.inputProps,
                "aria-label": "Select task priority",
              }}
            />
          )}
          onChange={(_, val) => handleChange(val)}
          onInputChange={(_, val) => handleInputChange(val)}
        />
      )}
      {touchScreen && (
        <FormControl fullWidth variant="outlined">
          <InputLabel shrink>{t("Priority")}</InputLabel>
          <Select
            value={value ?? ""}
            displayEmpty
            MenuProps={MenuProps}
            input={
              <OutlinedInput
                notched
                label={t("Priority")}
                inputProps={{ "aria-label": "Select task priority" }}
              />
            }
            onChange={(event) => handleChange(event.target.value)}
          >
            {selectOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {!item ? <em>{t("None")}</em> : item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
}
