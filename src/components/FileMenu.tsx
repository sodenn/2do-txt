import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
import DashboardIcon from "@mui/icons-material/Dashboard";
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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileManagementDialog } from "../data/FileManagementDialogContext";
import { useFilter } from "../data/FilterContext";
import { useShortcutsDialog } from "../data/ShortcutsDialogContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { hasTouchScreen } from "../utils/platform";
import StartEllipsis from "./StartEllipsis";

const buttonMaxWidthXs = 170;
const buttonMaxWidth = 300;
const menuMaxWidth = 350;

const FileMenu = () => {
  const { t } = useTranslation();
  const touchScreen = hasTouchScreen();
  const { setFileManagementDialogOpen } = useFileManagementDialog();
  const { setShortcutsDialogOpen } = useShortcutsDialog();
  const { taskLists, activeTaskList } = useTask();
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

  const handleManageFile = () => {
    handleClose();
    setFileManagementDialogOpen(true);
  };

  const handleKeyboardShortcutsClick = () => {
    handleClose();
    setShortcutsDialogOpen(true);
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
        {taskLists.length > 0 && (
          <MenuItem onClick={handleManageFile}>
            <ListItemIcon>
              <AllInboxRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Manage todo.txt")}</ListItemText>
          </MenuItem>
        )}
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
