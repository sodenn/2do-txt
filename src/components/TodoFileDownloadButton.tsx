import DownloadIcon from "@mui/icons-material/Download";
import { IconButton } from "@mui/material";
import React from "react";
import { useTask } from "../data/TaskContext";

const TodoFileDownloadButton = () => {
  const { downloadTodoFile } = useTask();
  return (
    <IconButton
      tabIndex={-1}
      aria-label="Download todo.txt"
      size="large"
      edge="end"
      color="inherit"
      onClick={() => downloadTodoFile()}
    >
      <DownloadIcon />
    </IconButton>
  );
};

export default TodoFileDownloadButton;
