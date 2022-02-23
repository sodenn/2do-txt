import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
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
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useFileManagementDialog } from "../data/FileManagementDialogContext";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import FilePicker from "./FilePicker";
import StartEllipsis from "./StartEllipsis";

const buttonMaxWidthXs = 170;
const buttonMaxWidth = 300;
const menuMaxWidth = 350;

const FileMenu = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { setFileManagementDialogOpen } = useFileManagementDialog();
  const { taskLists, activeTaskList, openTodoFileCreateDialog } = useTask();
  const {
    cloudStorage,
    setCloudStorageFileDialogOpen,
    cloudStorageEnabled,
    cloudStorageConnected,
  } = useCloudStorage();
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
    setFileManagementDialogOpen(true);
  };

  const handleImportFromCloudStorage = () => {
    handleClose();
    setCloudStorageFileDialogOpen(true);
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
        sx={{ maxWidth: { xs: buttonMaxWidthXs, md: buttonMaxWidth }, pl: 1 }}
        size="large"
        id="task-list-menu"
        startIcon={<img src={logo} alt="Logo" height={22} />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={handleClick}
      >
        <StartEllipsis>
          {activeTaskList ? activeTaskList.fileName : "2do.txt"}
        </StartEllipsis>
      </Button>
      <Menu
        sx={{ maxWidth: menuMaxWidth }}
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
              <StartEllipsis variant="inherit">{filePath}</StartEllipsis>
            </MenuItem>
          ))}
        {taskLists.length > 1 && <Divider />}
        {cloudStorageEnabled && cloudStorageConnected && (
          <MenuItem onClick={handleImportFromCloudStorage}>
            <ListItemIcon>
              <CloudOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("Cloud Storage Import", { cloudStorage })}
            </ListItemText>
          </MenuItem>
        )}
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
