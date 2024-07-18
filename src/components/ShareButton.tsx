import { Button } from "@/components/ui/button";
import { usePlatformStore } from "@/stores/platform-store";
import { useTask } from "@/utils/useTask";
import { Share2Icon, ShareIcon } from "lucide-react";

export function ShareButton() {
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
      size="icon"
      variant="outline"
      onClick={handleClick}
    >
      {platform === "ios" && <ShareIcon className="h-4 w-4" />}
      {platform === "android" && <Share2Icon className="h-4 w-4" />}
    </Button>
  );
}
