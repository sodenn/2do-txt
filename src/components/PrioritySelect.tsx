import { Autocomplete, TextField } from "@mui/material";
import { FC, useState } from "react";
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

interface PrioritySelectProps {
  value?: string;
  onChange?: (priority: any) => void;
}

const PrioritySelect: FC<PrioritySelectProps> = (props) => {
  const { value: initialValue, onChange } = props;
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue ?? null);
  const [autoSelect, setAutoSelect] = useState(false);

  const handleChange = (val: string | null) => {
    if (onChange) {
      onChange(val);
    }
    setValue(val);
  };

  const handleInputChange = (val: string) => {
    setAutoSelect(options.includes(val.toUpperCase()));
  };

  return (
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
  );
};

export default PrioritySelect;
