import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterStore } from "@/stores/filter-store";
import { TaskView, useSettingsStore } from "@/stores/settings-store";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function TaskViewSelect() {
  const { t } = useTranslation();
  const taskView = useSettingsStore((state) => state.taskView);
  const setTaskView = useSettingsStore((state) => state.setTaskView);
  const setSortBy = useFilterStore((state) => state.setSortBy);

  const labels = useMemo(
    () =>
      ({
        list: t("List"),
        timeline: t("Timeline"),
      }) as const,
    [t],
  );

  const handleChange = (value: TaskView) => {
    const newValue = value || "list";
    if (newValue === "timeline") {
      setSortBy("dueDate");
    }
    setTaskView(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="font-semibold">{t("View")}</div>
      <Select
        value={taskView}
        onValueChange={(value) => handleChange(value as TaskView)}
      >
        <SelectTrigger aria-label="Select task view">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="list" aria-label="List View">
            {labels.list}
          </SelectItem>
          <SelectItem value="timeline" aria-label="Timeline View">
            {labels.timeline}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
