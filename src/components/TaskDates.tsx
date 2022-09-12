import AccessAlarmOutlinedIcon from "@mui/icons-material/AccessAlarmOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { Box, Stack, styled } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSettings } from "../data/SettingsContext";
import { formatLocaleDate } from "../utils/date";
import { Task } from "../utils/task";
import { dateStyle } from "../utils/task-styles";

interface TaskDatesProps {
  task: Task;
}

const TextContainer = styled(Box)(({ theme }) => ({
  gap: theme.spacing(0.5),
  display: "flex",
  alignItems: "center",
  ...theme.typography.body2,
}));

const TaskDates = ({ task }: TaskDatesProps) => {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const { taskView } = useSettings();
  const { creationDate, completionDate, completed, dueDate } = task;
  return (
    <Stack direction="row" spacing={0.5}>
      {taskView === "list" && (
        <div>
          {completionDate && (
            <span style={dateStyle}>{t("Completed", { completionDate })}</span>
          )}
          {creationDate && !completed && (
            <span style={dateStyle}>{t("Created", { creationDate })}</span>
          )}
        </div>
      )}
      {taskView === "timeline" && (
        <>
          {dueDate && (
            <TextContainer sx={{ color: "warning.main" }}>
              <AccessAlarmOutlinedIcon fontSize="small" />
              {formatLocaleDate(dueDate, language)}
            </TextContainer>
          )}
          {completionDate && !dueDate && (
            <TextContainer sx={{ color: "text.disabled" }}>
              <CheckCircleOutlineOutlinedIcon fontSize="small" />
              {formatLocaleDate(completionDate, language)}
            </TextContainer>
          )}
          {creationDate && !dueDate && !completionDate && (
            <TextContainer sx={{ color: "text.secondary" }}>
              <AccessTimeOutlinedIcon fontSize="small" />
              {formatLocaleDate(creationDate, language)}
            </TextContainer>
          )}
        </>
      )}
    </Stack>
  );
};

export default TaskDates;
