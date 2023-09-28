import { StartEllipsis } from "@/components/StartEllipsis";
import logo from "@/images/logo.png";
import { hasTouchScreen } from "@/native-api/platform";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import { useTask } from "@/utils/useTask";
import AddIcon from "@mui/icons-material/Add";
import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import {
  Divider,
  Dropdown,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function FileMenu() {
  const { t } = useTranslation();
  const touchScreen = hasTouchScreen();
  const openFileManagementDialog = useFileManagementDialogStore(
    (state) => state.openFileManagementDialog,
  );
  const openShortcutsDialog = useShortcutsDialogStore(
    (state) => state.openShortcutsDialog,
  );
  const { taskLists, activeTaskList } = useTask();
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );

  const handleSetActiveList = async (filePath: string) => {
    setActiveTaskListPath(filePath);
  };

  const handleManageFile = () => {
    openFileManagementDialog();
  };

  const handleKeyboardShortcutsClick = () => {
    openShortcutsDialog();
  };

  const handleCreateFile = () => {
    openFileCreateDialog();
  };

  const menuItems: ReactNode[] = [];

  if (taskLists.length > 1) {
    menuItems.push(
      <MenuItem
        key="All"
        selected={!activeTaskList}
        onClick={() => handleSetActiveList("")}
      >
        <ListItemDecorator>
          <DashboardIcon fontSize="small" />
        </ListItemDecorator>{" "}
        {t("All")}
      </MenuItem>,
    );
  }

  if (taskLists.length > 1) {
    taskLists.forEach(({ filePath }) => {
      menuItems.push(
        <MenuItem
          selected={activeTaskList?.filePath === filePath}
          onClick={() => handleSetActiveList(filePath)}
          key={filePath}
        >
          <ListItemDecorator>
            <InsertDriveFileIcon fontSize="small" />
          </ListItemDecorator>
          <StartEllipsis>{filePath}</StartEllipsis>
        </MenuItem>,
      );
    });
  }

  if (taskLists.length > 0) {
    menuItems.push(
      <MenuItem onClick={handleManageFile} key="Files…">
        <ListItemDecorator>
          <AllInboxRoundedIcon fontSize="small" />
        </ListItemDecorator>{" "}
        {t("Files…")}
      </MenuItem>,
    );
  }

  if (!touchScreen && taskLists.length > 1) {
    menuItems.push(<Divider key="divider" />);
  }

  if (!touchScreen) {
    menuItems.push(
      <MenuItem onClick={handleKeyboardShortcutsClick} key="Keyboard Shortcuts">
        <ListItemDecorator>
          <KeyboardIcon fontSize="small" />
        </ListItemDecorator>{" "}
        {t("Keyboard Shortcuts")}
      </MenuItem>,
    );
  }

  if (menuItems.length === 1) {
    menuItems.push(
      <MenuItem onClick={handleCreateFile} key="Create file">
        <ListItemDecorator>
          <AddIcon fontSize="small" />
        </ListItemDecorator>{" "}
        {t("Create")}
      </MenuItem>,
    );
  }

  return (
    <Dropdown>
      <MenuButton
        sx={{ maxWidth: { xs: 170, md: 300 }, pl: 2 }}
        size="md"
        color="primary"
        variant="soft"
        aria-label="File menu"
        startDecorator={<img src={logo} alt="Logo" height={22} />}
        endDecorator={<ArrowDropDownIcon />}
      >
        <StartEllipsis>
          {activeTaskList ? activeTaskList.fileName : "2do.txt"}
        </StartEllipsis>
      </MenuButton>
      <Menu sx={{ maxWidth: 350 }} placement="bottom-start">
        {menuItems}
      </Menu>
    </Dropdown>
  );
}
