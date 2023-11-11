import { StartEllipsis } from "@/components/StartEllipsis";
import { TaskList } from "@/utils/task-list";
import { FormControl, FormLabel, Option, Select, SelectProps } from "@mui/joy";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FileSelectProps {
  options: TaskList[];
  onSelect: (value?: TaskList) => void;
}

export function FileSelect(props: FileSelectProps) {
  const { options, onSelect } = props;
  const { t } = useTranslation();
  const [filePath, setFilePath] = useState("");

  const handleChange: SelectProps<string, false>["onChange"] = (_, value) => {
    const filePath = value as string;
    const item = options.find((l) => l.filePath === filePath);
    onSelect(item);
    setFilePath(filePath);
  };

  return (
    <FormControl>
      <FormLabel required>{t("File")}</FormLabel>
      <Select
        placeholder={t("Select todo.txt")}
        required
        value={filePath}
        onChange={handleChange}
      >
        {options.map((item) => (
          <Option key={item.filePath} value={item.filePath}>
            <StartEllipsis sx={{ maxWidth: 300 }}>
              {item.filePath}
            </StartEllipsis>
          </Option>
        ))}
      </Select>
    </FormControl>
  );
}
