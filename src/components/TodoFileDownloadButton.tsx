import DownloadIcon from "@mui/icons-material/Download";
import IosShareIcon from "@mui/icons-material/IosShare";
import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { usePlatform } from "../utils/platform";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const TodoFileDownloadButton = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { downloadTodoFile, shareTodoFile } = useTask();

  const download = () => {
    shareTodoFile().catch((error) => {
      if (error.message && error.message.includes("Share API not available")) {
        downloadTodoFile();
      }
    });
  };

  useAddShortcutListener(() => download(), ["t"]);

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
        onClick={() => download()}
      >
        {(platform === "web" || platform === "electron") && <DownloadIcon />}
        {platform === "ios" && <IosShareIcon />}
        {platform === "android" && <ShareIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default TodoFileDownloadButton;
