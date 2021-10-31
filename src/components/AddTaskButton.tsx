import AddIcon from "@mui/icons-material/Add";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import { Kbd } from "./Kbd";

interface AddTaskButtonProps {
  edgeEnd: boolean;
}

const AddTaskButton = ({ edgeEnd }: AddTaskButtonProps) => {
  const { t } = useTranslation();
  const { openTaskDialog } = useTask();

  useAddShortcutListener(() => {
    openTaskDialog(true);
  }, ["n"]);

  return (
    <Tooltip
      title={
        <>
          {t("Add task")} <Kbd>N</Kbd>
        </>
      }
    >
      <IconButton
        tabIndex={-1}
        aria-label="Add task"
        size="large"
        edge={edgeEnd ? "end" : undefined}
        color="inherit"
        onClick={() => openTaskDialog(true)}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AddTaskButton;
