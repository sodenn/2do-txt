import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import TodoFilePicker from "./TodoFilePicker";

const maxWidth = 350;

const ButtonLabel = styled("span")(({ theme }) => ({
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  direction: "rtl",
  textAlign: "left",
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const TodoFileMenu = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const {
    taskLists,
    activeTaskList,
    openTodoFileCreateDialog,
    closeTodoFile,
    init,
  } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSetActiveList = (filePath: string) => {
    setActiveTaskListPath(filePath);
    handleClose();
  };

  const handleCreateFile = () => {
    openTodoFileCreateDialog(true);
    handleClose();
  };

  const handleCloseFile = () => {
    if (activeTaskList) {
      closeTodoFile(activeTaskList.filePath);
    }
    handleClose();
  };

  const openFileMenuItem = (
    <MenuItem onClick={handleClose}>
      <ListItemIcon>
        <FolderOpenOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>
        {platform === "electron" ? t("Open todo.txt") : t("Import todo.txt")}
      </ListItemText>
    </MenuItem>
  );

  if (!init || (init && taskLists.length === 0)) {
    return null;
  }

  return (
    <>
      <Button
        sx={{ maxWidth, pl: 1 }}
        size="large"
        id="task-list-menu"
        startIcon={<img src={logo} alt="Logo" height={22} />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={handleClick}
      >
        <ButtonLabel>
          {activeTaskList ? activeTaskList.fileName : "2do.txt"}
        </ButtonLabel>
      </Button>
      <Menu
        sx={{ maxWidth }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
      >
        {taskLists.length > 1 && (
          <MenuItem
            selected={!activeTaskList}
            onClick={() => handleSetActiveList("")}
          >
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("All")}</ListItemText>
          </MenuItem>
        )}
        {taskLists.length > 1 &&
          taskLists.map(({ filePath }, idx) => (
            <MenuItem
              selected={activeTaskList?.filePath === filePath}
              onClick={() => handleSetActiveList(filePath)}
              key={idx}
            >
              <ListItemIcon>
                <InsertDriveFileOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <Typography
                variant="inherit"
                noWrap
                sx={{ direction: "rtl", textAlign: "left" }}
              >
                {filePath}
              </Typography>
            </MenuItem>
          ))}
        {taskLists.length > 1 && <Divider />}
        {activeTaskList && (
          <MenuItem onClick={handleCloseFile}>
            <ListItemIcon>
              <CloseOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography
                variant="inherit"
                noWrap
                sx={{ direction: "rtl", textAlign: "left" }}
              >
                {t("Close todo.txt", { fileName: activeTaskList.fileName })}
              </Typography>
            </ListItemText>
          </MenuItem>
        )}
        <TodoFilePicker component={openFileMenuItem} onSelect={handleClose} />
        <MenuItem onClick={handleCreateFile}>
          <ListItemIcon>
            <AddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("Create todo.txt")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default TodoFileMenu;
