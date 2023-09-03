import { hasTouchScreen } from "@/native-api/platform";
import { Autocomplete, FormControl, FormLabel, Option, Select } from "@mui/joy";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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

interface PrioritySelectProps {
  value?: string;
  onChange?: (priority: any) => void;
}

export function PrioritySelect(props: PrioritySelectProps) {
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
    <FormControl>
      <FormLabel>{t("Priority")}</FormLabel>
      {!touchScreen && (
        <Autocomplete
          autoSelect={autoSelect}
          autoHighlight={autoSelect}
          value={value}
          options={options}
          slotProps={{
            input: {
              "aria-label": "Select task priority",
            },
          }}
          onChange={(_, val) => handleChange(val)}
          onInputChange={(_, val) => handleInputChange(val)}
        />
      )}
      {touchScreen && (
        <Select
          value={value ?? ""}
          placeholder={t("None")}
          slotProps={{
            button: {
              "aria-label": "Select task priority",
            },
          }}
          onChange={(_, value) => handleChange(value)}
        >
          {selectOptions.map((item) => (
            <Option key={item} value={item}>
              {!item ? t("None") : item}
            </Option>
          ))}
        </Select>
      )}
    </FormControl>
  );
}
