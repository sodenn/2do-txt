import AddTaskButton from "@/components/AddTaskButton";
import FileMenu from "@/components/FileMenu";
import SearchBar from "@/components/SearchBar";
import ShareButton from "@/components/ShareButton";
import { HeaderContainer } from "@/components/SideSheet";
import SideSheetButton from "@/components/SideSheetButton";
import usePlatformStore from "@/stores/platform-store";
import useSideSheetStore from "@/stores/side-sheet-store";
import useTask from "@/utils/useTask";
import { AppBar, Box, Fade, styled, Toolbar } from "@mui/material";
import { useState } from "react";

interface HeaderProps {
  divider?: boolean;
}

const SafeAreaAppBar = styled(AppBar)({
  paddingTop: "env(safe-area-inset-top)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

export default function Header({ divider = false }: HeaderProps) {
  const platform = usePlatformStore((state) => state.platform);
  const { activeTaskList, taskLists } = useTask();
  const sideSheetOpen = useSideSheetStore((state) => state.open);
  const [expanded, setExpanded] = useState(false);
  const showTodoFileDownloadButton =
    (platform === "ios" || platform === "android") &&
    (activeTaskList || taskLists.length === 1);

  return (
    <Box style={{ flex: "none", marginBottom: 2 }}>
      <HeaderContainer open={sideSheetOpen}>
        <SafeAreaAppBar
          position="static"
          color="transparent"
          elevation={divider ? 1 : 0}
        >
          <Toolbar>
            <Box sx={{ mr: { xs: 0, sm: 1 } }}>
              <SideSheetButton />
            </Box>
            <Fade in={!expanded} unmountOnExit>
              <div>{taskLists.length > 0 && <FileMenu />}</div>
            </Fade>
            {taskLists.length > 0 && <SearchBar onExpand={setExpanded} />}
            {taskLists.length > 0 && (
              <AddTaskButton
                sx={{ ml: { sm: 1 }, flexGrow: 0 }}
                edge={!showTodoFileDownloadButton ? "end" : undefined}
              />
            )}
            {showTodoFileDownloadButton && <ShareButton sx={{ flexGrow: 0 }} />}
          </Toolbar>
        </SafeAreaAppBar>
      </HeaderContainer>
    </Box>
  );
}
