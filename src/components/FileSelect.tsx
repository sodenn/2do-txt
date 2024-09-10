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
  const [id, setId] = useState("");

  const handleChange = (value: string) => {
    const id = parseInt(value);
    const item = options.find((l) => l.id === id);
    onSelect(item);
    setId(value);
  };

  return (
    <Select required value={id} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("Select list")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.id} value={item.id.toString()}>
            <div className="max-w-[300px] truncate">{item.filename}</div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
