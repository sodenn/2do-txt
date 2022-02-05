import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import TodoFilePicker from "./TodoFilePicker";

interface TodoFileMenuProps {
  hideButtonText?: boolean;
}

const TodoFileMenu = ({ hideButtonText }: TodoFileMenuProps) => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { taskLists, activeTaskList, openTodoFileCreateDialog, closeTodoFile } =
    useTask();
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

  return (
    <>
      <Button
        size="large"
        id="task-list-menu"
        endIcon={<KeyboardArrowDownIcon />}
        onClick={handleClick}
      >
        <img src={logo} alt="Logo" height={24} />
        {!hideButtonText && (
          <Box sx={{ pl: 1 }}>
            {activeTaskList ? activeTaskList.fileName : "2do.txt"}
          </Box>
        )}
      </Button>
      <Menu
        sx={{ maxWidth: 350 }}
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
              {t("Close todo.txt", { fileName: activeTaskList.fileName })}
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
