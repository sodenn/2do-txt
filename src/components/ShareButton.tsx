import { Button } from "@/components/ui/button";
import { IS_IOS } from "@/utils/platform";
import { useTask } from "@/utils/useTask";
import { Share2Icon, ShareIcon } from "lucide-react";

export function ShareButton() {
  const { shareTodoFile, selectedTaskLists, taskLists } = useTask();
  const selectedTaskList =
    taskLists.length === 1
      ? taskLists[0]
      : selectedTaskLists.length === 1
        ? selectedTaskLists[0]
        : undefined;

  if (!selectedTaskList) {
    return null;
  }

  return (
    <Button
      tabIndex={-1}
      aria-label="Share todo.txt"
      size="icon"
      variant="outline"
      onClick={() => shareTodoFile(selectedTaskList)}
    >
      {IS_IOS && <ShareIcon className="h-4 w-4" />}
      {!IS_IOS && <Share2Icon className="h-4 w-4" />}
    </Button>
  );
}
