import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TaskListState } from "../data/TaskContext";
import StartEllipsis from "./StartEllipsis";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

interface FileSelectProps {
  value: TaskListState[];
  onChange: (value?: TaskListState) => void;
}

const FileSelect = (props: FileSelectProps) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const [filePath, setFilePath] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    const filePath = event.target.value;
    if (onChange) {
      const list = value.find((l) => l.filePath === filePath);
      onChange(list);
    }
    setFilePath(filePath);
  };

  return (
    <FormControl fullWidth sx={{ minWidth: 110 }}>
      <Select
        required
        displayEmpty
        value={filePath}
        MenuProps={MenuProps}
        onChange={handleChange}
      >
        <MenuItem disabled value="">
          <em>{t("Select todo.txt")}</em>
        </MenuItem>
        {value.map((item, index) => (
          <MenuItem key={index} value={item.filePath}>
            <StartEllipsis sx={{ maxWidth: 300 }}>
              {item.filePath}
            </StartEllipsis>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FileSelect;
