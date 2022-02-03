import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
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
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import TodoFilePicker from "./TodoFilePicker";

const TodoFileMenu = () => {
  const { t } = useTranslation();
  const { taskLists, activeTaskList, openTodoFileCreateDialog } = useTask();
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

  const openFileMenuItem = (
    <MenuItem>
      <ListItemIcon>
        <FolderOpenOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>{t("Open todo.txt")}</ListItemText>
    </MenuItem>
  );

  return (
    <>
      <Button
        size="large"
        id="task-list-menu"
        sx={{ ml: 1 }}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={handleClick}
      >
        {activeTaskList ? activeTaskList.fileName : "2do.txt"}
      </Button>
      <Menu
        sx={{ maxWidth: 350 }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
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
