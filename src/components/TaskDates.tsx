import { Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Task } from "../utils/task";
import { taskDateStyle } from "../utils/task-styles";

interface TaskDatesProps {
  task: Task;
}

const TaskDates = ({ task }: TaskDatesProps) => {
  const { t } = useTranslation();
  const { creationDate, completionDate, completed } = task;
  return (
    <Stack direction="row" spacing={0.5}>
      {creationDate && !completed && (
        <div>
          <span className={taskDateStyle}>
            {t("Created", { creationDate })}
          </span>
        </div>
      )}
      {completionDate && completed && (
        <div>
          <span className={taskDateStyle}>
            {t("Completed", { completionDate })}
          </span>
        </div>
      )}
    </Stack>
  );
};

export default TaskDates;
