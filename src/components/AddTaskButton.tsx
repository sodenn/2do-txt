import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "@mui/material";
import React from "react";
import { useTask } from "../data/TaskContext";

interface AddTaskButtonProps {
  edgeEnd: boolean;
}

const AddTaskButton = ({ edgeEnd }: AddTaskButtonProps) => {
  const { openTaskDialog } = useTask();
  return (
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
  );
};

export default AddTaskButton;
