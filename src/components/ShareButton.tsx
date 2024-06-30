import { Button, ButtonProps } from "@/components/ui/button";
import { usePlatformStore } from "@/stores/platform-store";
import { useTask } from "@/utils/useTask";
import IosShareIcon from "@mui/icons-material/IosShare";
import ShareIcon from "@mui/icons-material/Share";

export function ShareButton(props: ButtonProps) {
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
    <Button
      tabIndex={-1}
      aria-label="Share todo.txt"
      variant="outline"
      onClick={handleClick}
      {...props}
    >
      {platform === "ios" && <IosShareIcon />}
      {platform === "android" && <ShareIcon />}
    </Button>
  );
}
