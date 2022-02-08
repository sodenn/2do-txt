import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import React, { useState } from "react";
import { TaskListState } from "../data/TaskContext";
import { generateId } from "../utils/uuid";

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
  const [filePath, setFilePath] = useState("");

  const labelId = generateId();

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
      <InputLabel id={labelId}>todo.txt</InputLabel>
      <Select
        required
        value={filePath}
        MenuProps={MenuProps}
        onChange={handleChange}
        labelId={labelId}
        label="todo.txt"
      >
        {value.map((item, index) => (
          <MenuItem key={index} value={item.filePath}>
            {item.filePath}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FileSelect;
