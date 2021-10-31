import DownloadIcon from "@mui/icons-material/Download";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import { Kbd } from "./Kbd";

const TodoFileDownloadButton = () => {
  const { t } = useTranslation();
  const { downloadTodoFile } = useTask();

  useAddShortcutListener(() => {
    downloadTodoFile();
  }, ["t"]);

  return (
    <Tooltip
      title={
        <>
          {t("Download todo.txt")} <Kbd>T</Kbd>
        </>
      }
    >
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
    </Tooltip>
  );
};

export default TodoFileDownloadButton;
