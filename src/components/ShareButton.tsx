import { usePlatformStore } from "@/stores/platform-store";
import { useTask } from "@/utils/useTask";
import IosShareIcon from "@mui/icons-material/IosShare";
import ShareIcon from "@mui/icons-material/Share";
import { IconButton, IconButtonProps } from "@mui/material";

export function ShareButton(props: IconButtonProps) {
  const { downloadTodoFile, shareTodoFile } = useTask();
  const platform = usePlatformStore((state) => state.platform);

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
}
