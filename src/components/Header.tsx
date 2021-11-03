import { AppBar, Box, styled, Toolbar, Typography } from "@mui/material";
import React from "react";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import AddTaskButton from "./AddTaskButton";
import SearchBar from "./SearchBar";
import SideSheetButton from "./SideSheetButton";
import TodoFileDownloadButton from "./TodoFileDownloadButton";

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
            <Typography variant="h6" noWrap component="div" sx={{ ml: 1 }}>
              2do.txt
            </Typography>
          </Box>
          <SearchBar />
          <Box sx={{ ml: 1, flexGrow: 0 }}>
            <AddTaskButton edgeEnd={!showTodoFileDownloadButton} />
          </Box>
          {showTodoFileDownloadButton && (
            <Box sx={{ ml: 0.5, flexGrow: 0 }}>
              <TodoFileDownloadButton />
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

export default Header;
