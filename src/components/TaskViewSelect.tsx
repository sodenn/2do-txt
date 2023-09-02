import { NewBadge } from "@/components/NewBadge";
import { useFilterStore } from "@/stores/filter-store";
import { TaskView, useSettingsStore } from "@/stores/settings-store";
import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";

export function TaskViewSelect() {
  const { t } = useTranslation();
  const taskView = useSettingsStore((state) => state.taskView);
  const setTaskView = useSettingsStore((state) => state.setTaskView);
  const setSortBy = useFilterStore((state) => state.setSortBy);

  const handleChange = (value: TaskView) => {
    if (value === "timeline") {
      setSortBy("dueDate");
    }
    setTaskView(value);
  };

  return (
    <Select
      fullWidth
      size="small"
      value={taskView}
      inputProps={{ "aria-label": "Select task view" }}
      onChange={(event) => handleChange(event.target.value as TaskView)}
    >
      <MenuItem value="list" aria-label="List View">
        {t("List View")}
      </MenuItem>
      <MenuItem value="timeline" aria-label="Timeline View">
        <NewBadge till={new Date("2023-01-01T00:00:00.000Z")}>
          {t("Timeline View")}
        </NewBadge>
      </MenuItem>
    </Select>
  );
}
