import { useFilterStore } from "@/stores/filter-store";
import { TaskView, useSettingsStore } from "@/stores/settings-store";
import { FormControl, FormLabel, Option, Select, SelectProps } from "@mui/joy";
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

  const handleChange: SelectProps<TaskView, false>["onChange"] = (_, value) => {
    const newValue = value || "list";
    if (newValue === "timeline") {
      setSortBy("dueDate");
    }
    setTaskView(newValue);
  };

  return (
    <FormControl>
      <FormLabel>{t("Task view")}</FormLabel>
      <Select
        value={taskView}
        onChange={handleChange}
        renderValue={(opt) => (opt ? labels[opt.value] : null)}
        slotProps={{
          root: {
            "aria-label": "Select task view",
          },
        }}
      >
        <Option value="list" aria-label="List View">
          {labels.list}
        </Option>
        <Option value="timeline" aria-label="Timeline View">
          {labels.timeline}
        </Option>
      </Select>
    </FormControl>
  );
}
