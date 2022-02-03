import { AppBar, Box, styled, Toolbar } from "@mui/material";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
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
  return (
    <Box style={{ flex: "none", marginBottom: 2 }}>
      <StyledAppBar
        position="static"
        color="transparent"
        elevation={divider ? 1 : 0}
      >
        <Toolbar>
          <Box sx={{ mr: 1 }}>
            <SideSheetButton />
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
            }}
          >
            <img src={logo} alt="Logo" height={24} />
            <TodoFileMenu />
          </Box>
          {taskLists.length > 0 && <SearchBar />}
          {taskLists.length > 0 && (
            <AddTaskButton
              sx={{ ml: 1, flexGrow: 0 }}
              edge={!showTodoFileDownloadButton ? "end" : undefined}
            />
          )}
          {showTodoFileDownloadButton &&
            init &&
            (activeTaskList || taskLists.length === 1) && (
              <TodoFileDownloadButton sx={{ ml: 0.5, flexGrow: 0 }} />
            )}
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

export default Header;
