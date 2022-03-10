import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
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
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useFileManagementDialog } from "../data/FileManagementDialogContext";
import { useFilter } from "../data/FilterContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import DropboxIcon from "./DropboxIcon";
import StartEllipsis from "./StartEllipsis";

const buttonMaxWidthXs = 170;
const buttonMaxWidth = 300;
const menuMaxWidth = 350;

const FileMenu = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { setFileManagementDialogOpen } = useFileManagementDialog();
  const { setFileCreateDialogOpen } = useFileCreateDialog();
  const { taskLists, activeTaskList, openTodoFilePicker } = useTask();
  const {
    setCloudFileDialogOptions,
    cloudStorageEnabled,
    connectedCloudStorages,
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

  const handleImportFromCloudStorage = () => {
    handleClose();
    setCloudFileDialogOptions({ open: true, cloudStorage: "Dropbox" });
  };

  const handleCreateFile = () => {
    setFileCreateDialogOpen(true);
    handleClose();
  };

  const handleManageFile = () => {
    handleClose();
    setFileManagementDialogOpen(true);
  };

  const handleOpenFile = () => {
    handleClose();
    openTodoFilePicker();
  };

  return (
    <>
      <Button
        sx={{ maxWidth: { xs: buttonMaxWidthXs, md: buttonMaxWidth }, pl: 1 }}
        size="large"
        aria-label="File menu"
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
        {taskLists.length < 4 && (
          <MenuItem onClick={handleCreateFile}>
            <ListItemIcon>
              <AddOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Create todo.txt")}</ListItemText>
          </MenuItem>
        )}
        {taskLists.length < 4 && (
          <MenuItem onClick={handleOpenFile}>
            <ListItemIcon>
              <FolderOpenOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {platform === "electron"
                ? t("Open todo.txt")
                : t("Import todo.txt")}
            </ListItemText>
          </MenuItem>
        )}
        {taskLists.length < 4 &&
          cloudStorageEnabled &&
          connectedCloudStorages["Dropbox"] && (
            <MenuItem onClick={handleImportFromCloudStorage}>
              <ListItemIcon>
                <DropboxIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {t("Import from cloud storage", { cloudStorage: "Dropbox" })}
              </ListItemText>
            </MenuItem>
          )}
        {taskLists.length > 0 && (
          <MenuItem onClick={handleManageFile}>
            <ListItemIcon>
              <AllInboxRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Manage todo.txt")}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default FileMenu;
