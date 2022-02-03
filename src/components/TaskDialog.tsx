import { css } from "@emotion/css";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Theme,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { Task, TaskFormData } from "../utils/task";
import { isSuggestionsPopupOpen } from "./TaskEditor";
import TaskForm from "./TaskForm";

const initialTaskFormData: TaskFormData = {
  body: "",
  creationDate: undefined,
  completionDate: undefined,
};

export const dialogPaperStyle = (theme: Theme) => css`
  ${theme.breakpoints.down("sm")} {
    &.MuiPaper-root {
      margin: ${theme.spacing(2)};
      width: 100%;
    }
  }
`;

const createFormData = (createCreationDate: boolean, activeTask?: Task) => {
  if (activeTask) {
    return {
      _id: activeTask._id,
      body: activeTask.body,
      priority: activeTask.priority,
      creationDate: activeTask.creationDate,
      completionDate: activeTask.completionDate,
      dueDate: activeTask.dueDate,
    };
  } else {
    const creationDate = createCreationDate ? new Date() : undefined;
    return { ...initialTaskFormData, creationDate };
  }
};

const TaskDialog = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    openTaskDialog,
    taskDialogOpen,
    findTaskListByTaskId,
    taskLists,
    activeTask,
    activeTaskList,
    addTask,
    editTask,
    contexts: commonContexts,
    projects: commonProjects,
    tags: commonTags,
  } = useTask();
  const { createCreationDate } = useSettings();
  const [formData, setFormData] = useState<TaskFormData>(initialTaskFormData);
  const [selectedFilePath, setSelectedFilePath] = useState<string | undefined>(
    () => {
      if (activeTask) {
        const list = findTaskListByTaskId(activeTask._id);
        return list?.filePath;
      } else if (activeTaskList) {
        return activeTaskList.filePath;
      }
    }
  );

  const formDisabled = !formData.body || (!activeTaskList && !selectedFilePath);
  const contexts = activeTaskList ? activeTaskList.contexts : commonContexts;
  const projects = activeTaskList ? activeTaskList.projects : commonProjects;
  const tags = activeTaskList ? activeTaskList.tags : commonTags;
  const fileList = selectedFilePath
    ? []
    : taskLists.map((list) => ({
        filePath: list.filePath,
        fileName: list.fileName,
      }));

  useEffect(() => {
    if (!taskDialogOpen) {
      return;
    }
    setFormData(createFormData(createCreationDate, activeTask));
    setSelectedFilePath(() => {
      if (activeTask) {
        const list = findTaskListByTaskId(activeTask._id);
        return list?.filePath;
      } else if (activeTaskList) {
        return activeTaskList.filePath;
      } else {
        return undefined;
      }
    });
  }, [
    createCreationDate,
    activeTask,
    taskDialogOpen,
    activeTaskList,
    findTaskListByTaskId,
  ]);

  const closeDialog = () => openTaskDialog(false);

  const handleSave = () => {
    closeDialog();
    if (formData._id) {
      editTask(formData);
    } else {
      addTask(formData);
    }
  };

  const handleChange = (data: TaskFormData) => {
    setFormData((task) => ({ ...task, ...data }));
  };

  const handleFileListChange = (filePath?: string) => {
    setSelectedFilePath(filePath);
  };

  const handleClose = (
    event: any,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    return reason !== "backdropClick" && !isSuggestionsPopupOpen()
      ? closeDialog()
      : undefined;
  };

  return (
    <Dialog
      aria-label="Task dialog"
      fullWidth
      maxWidth="sm"
      open={taskDialogOpen}
      classes={{ paper: dialogPaperStyle(theme) }}
      onClose={handleClose}
    >
      <DialogTitle>
        {!!formData._id ? t("Edit Task") : t("Create Task")}
      </DialogTitle>
      <DialogContent>
        <TaskForm
          formData={formData}
          contexts={Object.keys(contexts)}
          projects={Object.keys(projects)}
          tags={tags}
          fileList={fileList}
          onChange={handleChange}
          onFileListChange={handleFileListChange}
          onEnterPress={handleSave}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>{t("Cancel")}</Button>
        <Button disabled={formDisabled} onClick={handleSave}>
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;
