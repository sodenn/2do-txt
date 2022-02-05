import { AppBar, Box, Fade, styled, Toolbar } from "@mui/material";
import { useState } from "react";
import { useTask } from "../data/TaskContext";
import { usePlatform } from "../utils/platform";
import AddTaskButton from "./AddTaskButton";
import SearchBar from "./SearchBar";
import SideSheetButton from "./SideSheetButton";
import TodoFileDownloadButton from "./TodoFileDownloadButton";
import TodoFileMenu from "./TodoFileMenu";

interface HeaderProps {
  divider?: boolean;
}

export const StyledAppBar = styled(AppBar)`
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
`;

const Header = ({ divider = false }: HeaderProps) => {
  const platform = usePlatform();
  const { init, activeTaskList, taskLists } = useTask();
  const showTodoFileDownloadButton = platform !== "electron";
  const [expanded, setExpanded] = useState(false);

  return (
    <Box style={{ flex: "none", marginBottom: 2 }}>
      <StyledAppBar
        position="static"
        color="transparent"
        elevation={divider ? 1 : 0}
      >
        <Toolbar>
          <Box sx={{ mr: { xs: 0, md: 1 } }}>
            <SideSheetButton />
          </Box>
          <Fade in={!expanded} unmountOnExit>
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
              }}
            >
              <TodoFileMenu hideButtonText />
            </Box>
          </Fade>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
            }}
          >
            <TodoFileMenu />
          </Box>
          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
          {taskLists.length > 0 && <SearchBar onExpand={setExpanded} />}
          {taskLists.length > 0 && (
            <AddTaskButton
              sx={{ ml: { md: 1 }, flexGrow: 0 }}
              edge={!showTodoFileDownloadButton ? "end" : undefined}
            />
          )}
          {showTodoFileDownloadButton &&
            init &&
            (activeTaskList || taskLists.length === 1) && (
              <TodoFileDownloadButton sx={{ flexGrow: 0 }} />
            )}
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

export default Header;
