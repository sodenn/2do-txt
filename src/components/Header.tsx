import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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

const Header = ({ divider = false }: HeaderProps) => {
  const theme = useTheme();
  const platform = usePlatform();
  const sm = useMediaQuery(theme.breakpoints.up("sm"));
  const showTodoFileDownloadButton = platform === "web" && sm;
  return (
    <Box style={{ flex: "none", marginBottom: 2 }}>
      <AppBar position="static" color="transparent" elevation={divider ? 1 : 0}>
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
          <Box sx={{ ml: 1 }}>
            <AddTaskButton edgeEnd={!showTodoFileDownloadButton} />
          </Box>
          {showTodoFileDownloadButton && (
            <Box sx={{ ml: 1 }}>
              <TodoFileDownloadButton />
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
