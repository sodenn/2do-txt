import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { TaskView, useSettings } from "../data/SettingsContext";
import NewBadge from "./NewBadge";

const TaskViewSelect = () => {
  const { t } = useTranslation();
  const { taskView, setTaskView } = useSettings();
  const { setSortBy } = useFilter();

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
      aria-label="Select task view"
      onChange={(event) => handleChange(event.target.value as TaskView)}
    >
      <MenuItem value="list">{t("List View")}</MenuItem>
      <MenuItem value="timeline">
        <NewBadge till={new Date("2023-01-01T00:00:00.000Z")}>
          {t("Timeline View")}
        </NewBadge>
      </MenuItem>
    </Select>
  );
};

export default TaskViewSelect;
