import { Clipboard } from "@capacitor/clipboard";
import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import QuestionMarkOutlinedIcon from "@mui/icons-material/QuestionMarkOutlined";
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileManagementDialog } from "../data/FileManagementDialogContext";
import { useFilter } from "../data/FilterContext";
import { useShortcutsDialog } from "../data/ShortcutsDialogContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { getFilesystem } from "../utils/filesystem";
import { getPlatform, hasTouchScreen } from "../utils/platform";
import StartEllipsis from "./StartEllipsis";

const buttonMaxWidthXs = 170;
const buttonMaxWidth = 300;
const menuMaxWidth = 350;

const FileMenu = () => {
  const platform = getPlatform();
  const { t } = useTranslation();
  const touchScreen = hasTouchScreen();
  const { setFileManagementDialogOpen } = useFileManagementDialog();
  const { setShortcutsDialogOpen } = useShortcutsDialog();
  const { taskLists, activeTaskList, downloadTodoFile } = useTask();
  const { setActiveTaskListPath } = useFilter();
  const { readFile } = getFilesystem();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    return new Promise((resolve) => setTimeout(resolve, 200));
  };

  const handleSetActiveList = async (filePath: string) => {
    await handleClose();
    setActiveTaskListPath(filePath);
  };

  const handleManageFile = () => {
    handleClose();
    setFileManagementDialogOpen(true);
  };

  const handleKeyboardShortcutsClick = () => {
    handleClose();
    setShortcutsDialogOpen(true);
  };

  const handleCopyToClipboard = async (filePath: string) => {
    const { data } = await readFile({
      path: filePath,
    });
    await Clipboard.write({
      string: data,
    });
    enqueueSnackbar(t("Copied to clipboard"), { variant: "info" });
    handleClose();
  };

  return (
    <>
      <Button
        sx={{ maxWidth: { xs: buttonMaxWidthXs, md: buttonMaxWidth }, pl: 2 }}
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
        {activeTaskList && platform === "web" && (
          <MenuItem aria-label="Download todo.txt" onClick={downloadTodoFile}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText>{t("Download")}</ListItemText>
          </MenuItem>
        )}
        {activeTaskList && (platform === "electron" || platform === "web") && (
          <MenuItem
            onClick={() => handleCopyToClipboard(activeTaskList.filePath)}
          >
            <ListItemIcon>
              <ContentCopyIcon />
            </ListItemIcon>
            <ListItemText>{t("Copy to clipboard")}</ListItemText>
          </MenuItem>
        )}
        {activeTaskList && (platform === "electron" || platform === "web") && (
          <Divider />
        )}
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
        {taskLists.length > 0 && (
          <MenuItem onClick={handleManageFile}>
            <ListItemIcon>
              <AllInboxRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Manage todo.txt")}</ListItemText>
          </MenuItem>
        )}
        {!touchScreen && taskLists.length > 1 && <Divider />}
        {!touchScreen && (
          <MenuItem onClick={handleKeyboardShortcutsClick}>
            <ListItemIcon>
              <QuestionMarkOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Keyboard Shortcuts")}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default FileMenu;
