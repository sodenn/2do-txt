import { Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Task } from "../utils/task";
import { dateStyle } from "../utils/task-styles";

interface TaskDatesProps {
  task: Task;
}

const TaskDates = ({ task }: TaskDatesProps) => {
  const { t } = useTranslation();
  const { creationDate, completionDate, completed } = task;
  return (
    <Stack direction="row" spacing={0.5}>
      <div>
        {completionDate && (
          <span style={dateStyle}>{t("Completed", { completionDate })}</span>
        )}
        {creationDate && !completed && (
          <span style={dateStyle}>{t("Created", { creationDate })}</span>
        )}
      </div>
    </Stack>
  );
};

export default TaskDates;
