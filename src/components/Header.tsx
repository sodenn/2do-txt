import { AddTaskButton } from "@/components/AddTaskButton";
import { Fade } from "@/components/Fade";
import { FileMenu } from "@/components/FileMenu";
import { LayoutHeader } from "@/components/Layout";
import { SearchBar } from "@/components/SearchBar";
import { ShareButton } from "@/components/ShareButton";
import { SideSheetButton } from "@/components/SideSheetButton";
import { usePlatformStore } from "@/stores/platform-store";
import { useSideSheetStore } from "@/stores/side-sheet-store";
import { useTask } from "@/utils/useTask";
import { Box, Divider, Stack, styled } from "@mui/joy";
import { useState } from "react";

interface HeaderProps {
  divider?: boolean;
}

const SafeAreaBox = styled(Box)({
  paddingTop: "env(safe-area-inset-top)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

export function Header({ divider = false }: HeaderProps) {
  const platform = usePlatformStore((state) => state.platform);
  const { activeTaskList, taskLists } = useTask();
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const [searchBarExpanded, setSearchBarExpanded] = useState(false);
  const showTodoFileDownloadButton =
    (platform === "ios" || platform === "android") &&
    (activeTaskList || taskLists.length === 1);

  return (
    <LayoutHeader open={sideSheetOpen}>
      <SafeAreaBox>
        <Stack
          direction="row"
          sx={{ py: 1, px: { xs: 1.5, sm: 2.5 } }}
          spacing={1}
        >
          <SideSheetButton />
          <Fade in={!searchBarExpanded} unmountOnExit>
            <div>{taskLists.length > 0 && <FileMenu />}</div>
          </Fade>
          {taskLists.length > 0 && (
            <SearchBar onExpand={setSearchBarExpanded} />
          )}
          {showTodoFileDownloadButton && <ShareButton />}
          {taskLists.length > 0 && <AddTaskButton />}
        </Stack>
      </SafeAreaBox>
      <Divider sx={{ visibility: divider ? "visible" : "hidden" }} />
    </LayoutHeader>
  );
}
