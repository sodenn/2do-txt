import { StartEllipsis } from "@/components/StartEllipsis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskList } from "@/utils/task-list";
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

  const handleChange = (value: string) => {
    const filePath = value as string;
    const item = options.find((l) => l.filePath === filePath);
    onSelect(item);
    setFilePath(filePath);
  };

  return (
    <Select required value={filePath} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("Select todo.txt")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.filePath} value={item.filePath}>
            <StartEllipsis className="max-w-[300px]">
              {item.filePath}
            </StartEllipsis>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
