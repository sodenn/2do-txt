import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from "@mui/material";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlatform } from "../utils/platform";

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

const PrioritySelect: FC<PrioritySelectProps> = (props) => {
  const { value: initialValue, onChange } = props;
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue ?? null);
  const [autoSelect, setAutoSelect] = useState(false);
  const platform = usePlatform();

  const handleChange = (val: string | null) => {
    onChange?.(val);
    setValue(val);
  };

  const handleInputChange = (val: string) => {
    setAutoSelect(options.includes(val.toUpperCase()));
  };

  return (
    <>
      {platform !== "ios" && platform !== "android" && (
        <Autocomplete
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
      {(platform === "ios" || platform === "android") && (
        <FormControl fullWidth>
          <InputLabel>{t("Priority")}</InputLabel>
          <Select
            value={value}
            MenuProps={MenuProps}
            input={
              <OutlinedInput
                label={t("Priority")}
                inputProps={{ "aria-label": "Select task priority" }}
              />
            }
            onChange={(event) => handleChange(event.target.value)}
          >
            <MenuItem value="">{t("None")}</MenuItem>
            {options.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};

export default PrioritySelect;
