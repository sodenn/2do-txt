import IosShareIcon from "@mui/icons-material/IosShare";
import ShareIcon from "@mui/icons-material/Share";
import { IconButton, IconButtonProps } from "@mui/material";
import { useTask } from "../data/TaskContext";
import { getPlatform } from "../utils/platform";

const ShareButton = (props: IconButtonProps) => {
  const platform = getPlatform();
  const { downloadTodoFile, shareTodoFile } = useTask();

  const handleClick = () => {
    shareTodoFile().catch((error) => {
      if (error.message && error.message.includes("Share API not available")) {
        // download as a fallback
        downloadTodoFile();
      }
    });
  };

  return (
    <IconButton
      tabIndex={-1}
      aria-label="Share todo.txt"
      size="large"
      edge="end"
      color="inherit"
      onClick={handleClick}
      {...props}
    >
      {platform === "ios" && <IosShareIcon />}
      {platform === "android" && <ShareIcon />}
    </IconButton>
  );
};

export default ShareButton;
