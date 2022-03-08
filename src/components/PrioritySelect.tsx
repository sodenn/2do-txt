import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

const priorities = [
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
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

interface PrioritySelectProps {
  value?: string;
  onChange?: (priority: any) => void;
}

const PrioritySelect: FC<PrioritySelectProps> = (props) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const [selectedPriority, setActivePriority] = useState(value ?? "");

  return (
    <FormControl fullWidth sx={{ minWidth: 110 }}>
      <InputLabel>{t("Priority")}</InputLabel>
      <Select
        value={selectedPriority}
        MenuProps={MenuProps}
        input={
          <OutlinedInput
            label={t("Priority")}
            inputProps={{ "aria-label": "Select task priority" }}
          />
        }
        onChange={(event) => {
          const priority = event.target.value;
          if (onChange) {
            onChange(priority);
          }
          setActivePriority(priority);
        }}
      >
        <MenuItem value="">{t("None")}</MenuItem>
        {priorities.map((priority, index) => (
          <MenuItem key={index} value={priority}>
            {priority}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default PrioritySelect;
