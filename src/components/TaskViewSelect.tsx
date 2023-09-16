import { NewBadge } from "@/components/NewBadge";
import { useFilterStore } from "@/stores/filter-store";
import { TaskView, useSettingsStore } from "@/stores/settings-store";
import { Option, Select, SelectProps } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function TaskViewSelect() {
  const { t } = useTranslation();
  const taskView = useSettingsStore((state) => state.taskView);
  const setTaskView = useSettingsStore((state) => state.setTaskView);
  const setSortBy = useFilterStore((state) => state.setSortBy);

  const handleChange: SelectProps<TaskView>["onChange"] = (_, value) => {
    const newValue = value || "list";
    if (newValue === "timeline") {
      setSortBy("dueDate");
    }
    setTaskView(newValue);
  };

  return (
    <Select
      value={taskView}
      onChange={handleChange}
      slotProps={{
        button: {
          "aria-label": "Select task view",
        },
      }}
    >
      <Option value="list" aria-label="List View">
        {t("List View")}
      </Option>
      <Option value="timeline" aria-label="Timeline View">
        <NewBadge till={new Date("2023-01-01T00:00:00.000Z")}>
          {t("Timeline View")}
        </NewBadge>
      </Option>
    </Select>
  );
}
