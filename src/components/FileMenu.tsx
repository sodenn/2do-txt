import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import InboxIcon from "@mui/icons-material/Inbox";
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
import { useFileManagementDialog } from "../data/FileManagementContext";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import FilePicker from "./FilePicker";

const maxWidthXs = 170;
const maxWidth = 300;

const ButtonLabel = styled("span")(({ theme }) => ({
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  direction: "rtl",
  textAlign: "left",
}));

const FileMenu = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { openFileManagementDialog } = useFileManagementDialog();
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

  const handleManageFile = () => {
    handleClose();
    openFileManagementDialog();
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
        sx={{ maxWidth: { xs: maxWidthXs, md: maxWidth }, pl: 1 }}
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
        <FilePicker component={openFileMenuItem} />
        <MenuItem onClick={handleCreateFile}>
          <ListItemIcon>
            <AddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("Create todo.txt")}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleManageFile}>
          <ListItemIcon>
            <InboxIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("Manage todo.txt")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default FileMenu;
