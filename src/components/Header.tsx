import { AddTaskButton } from "@/components/AddTaskButton";
import { Fade } from "@/components/Fade";
import { FileMenu } from "@/components/FileMenu";
import { LayoutHeader } from "@/components/Layout";
import { SafeArea } from "@/components/SafeArea";
import { SearchBar } from "@/components/SearchBar";
import { ShareButton } from "@/components/ShareButton";
import { SideSheetButton } from "@/components/SideSheetButton";
import { usePlatformStore } from "@/stores/platform-store";
import { useScrollingStore } from "@/stores/scrolling-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { cn } from "@/utils/tw-utils";
import { useTask } from "@/utils/useTask";
import { useState } from "react";

export function Header() {
  const divider = useScrollingStore((state) => state.divider);
  const platform = usePlatformStore((state) => state.platform);
  const { activeTaskList, taskLists } = useTask();
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const [searchBarExpanded, setSearchBarExpanded] = useState(false);
  const showTodoFileDownloadButton =
    (platform === "ios" || platform === "android") &&
    (activeTaskList || taskLists.length === 1);

  return (
    <LayoutHeader open={sideSheetOpen}>
      <SafeArea className={cn(divider && "border-b")} top left right>
        <div className="flex items-center gap-1 p-2 sm:gap-2 sm:px-5 sm:py-3">
          <SideSheetButton />
          <Fade in={!searchBarExpanded} unmountOnExit>
            <div>{taskLists.length > 0 && <FileMenu />}</div>
          </Fade>
          {taskLists.length > 0 && (
            <SearchBar onExpand={setSearchBarExpanded} />
          )}
          {showTodoFileDownloadButton && <ShareButton />}
          {taskLists.length > 0 && <AddTaskButton />}
        </div>
      </SafeArea>
    </LayoutHeader>
  );
}
