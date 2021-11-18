import DownloadIcon from "@mui/icons-material/Download";
import IosShareIcon from "@mui/icons-material/IosShare";
import ShareIcon from "@mui/icons-material/Share";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { usePlatform } from "../utils/platform";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const TodoFileDownloadButton = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { downloadTodoFile, shareTodoFile, tasksLoaded } = useTask();

  const download = () => {
    if (platform === "web" || platform === "electron") {
      downloadTodoFile();
    } else {
      shareTodoFile().catch((error) => {
        if (
          error.message &&
          error.message.includes("Share API not available")
        ) {
          // download as a fallback
          downloadTodoFile();
        }
      });
    }
  };

  useAddShortcutListener(download, "t");

  if (!tasksLoaded) {
    return null;
  }

  return (
    <Tooltip
      title={
        <>
          {t("Download todo.txt")}{" "}
          <Box component="span" sx={{ ml: 0.5 }}>
            <Kbd>T</Kbd>
          </Box>
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
