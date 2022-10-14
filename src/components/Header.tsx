import { AppBar, Box, Fade, styled, Toolbar } from "@mui/material";
import { useState } from "react";
import { useSideSheet } from "../data/SideSheetContext";
import { useTask } from "../data/TaskContext";
import { getPlatform } from "../utils/platform";
import AddTaskButton from "./AddTaskButton";
import DownloadButton from "./DownloadButton";
import FileMenu from "./FileMenu";
import SearchBar from "./SearchBar";
import { HeaderContainer } from "./SideSheet";
import SideSheetButton from "./SideSheetButton";

interface HeaderProps {
  divider?: boolean;
}

const SafeAreaAppBar = styled(AppBar)({
  paddingTop: "env(safe-area-inset-top)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

const Header = ({ divider = false }: HeaderProps) => {
  const platform = getPlatform();
  const { activeTaskList, taskLists } = useTask();
  const { sideSheetOpen } = useSideSheet();
  const [expanded, setExpanded] = useState(false);
  const showTodoFileDownloadButton =
    platform !== "electron" && (activeTaskList || taskLists.length === 1);

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
            {showTodoFileDownloadButton && (
              <DownloadButton sx={{ flexGrow: 0 }} />
            )}
          </Toolbar>
        </SafeAreaAppBar>
      </HeaderContainer>
    </Box>
  );
};

export default Header;
