import { Stack } from "@mui/material";
import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import { Task } from "../utils/task";
import {
  taskDateStyle,
  taskDisabledStyle,
  taskSmallStyle,
  taskTagStyle,
} from "../utils/task-styles";

interface TaskDatesProps {
  task: Task;
}

const TaskDates = ({ task }: TaskDatesProps) => {
  const { t } = useTranslation();
  const { creationDate, completionDate, completed } = task;
  const classes = clsx(taskTagStyle, taskDateStyle, taskSmallStyle, {
    [taskDisabledStyle]: completed,
  });
  return (
    <Stack direction="row" spacing={0.5}>
      {creationDate && (
        <div>
          <span className={classes}>{t("Created", { creationDate })}</span>
        </div>
      )}
      {completionDate && (
        <div>
          <span className={classes}>{t("Completed", { completionDate })}</span>
        </div>
      )}
    </Stack>
  );
};

export default TaskDates;
