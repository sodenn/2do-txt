import StartEllipsis from "@/components/StartEllipsis";
import { TaskList } from "@/utils/task-list";
import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FileSelectProps {
  options: TaskList[];
  onSelect: (value?: TaskList) => void;
}

export default function FileSelect(props: FileSelectProps) {
  const { options, onSelect } = props;
  const { t } = useTranslation();
  const [filePath, setFilePath] = useState("");

  const handleChange = (event: SelectChangeEvent) => {
    const filePath = event.target.value;
    const item = options.find((l) => l.filePath === filePath);
    onSelect(item);
    setFilePath(filePath);
  };

  return (
    <FormControl fullWidth>
      <Select required displayEmpty value={filePath} onChange={handleChange}>
        <MenuItem disabled value="">
          <em>{t("Select todo.txt")}</em>
        </MenuItem>
        {options.map((item) => (
          <MenuItem key={item.filePath} value={item.filePath}>
            <StartEllipsis sx={{ maxWidth: 300 }}>
              {item.filePath}
            </StartEllipsis>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
