import { StartEllipsis } from "@/components/StartEllipsis";
import logo from "@/images/logo.png";
import { hasTouchScreen } from "@/native-api/platform";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import { useTask } from "@/utils/useTask";
import AllInboxRoundedIcon from "@mui/icons-material/AllInboxRounded";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import {
  Divider,
  Dropdown,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
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

  const handleSetActiveList = async (filePath: string) => {
    setActiveTaskListPath(filePath);
  };

  const handleManageFile = () => {
    openFileManagementDialog();
  };

  const handleKeyboardShortcutsClick = () => {
    openShortcutsDialog();
  };

  return (
    <Dropdown>
      <MenuButton
        sx={{ maxWidth: { xs: 170, md: 300 }, pl: 2 }}
        size="md"
        color="primary"
        variant="soft"
        aria-label="File menu"
        startDecorator={<img src={logo} alt="Logo" height={22} />}
        endDecorator={<ArrowDropDown />}
      >
        <StartEllipsis>
          {activeTaskList ? activeTaskList.fileName : "2do.txt"}
        </StartEllipsis>
      </MenuButton>
      <Menu sx={{ maxWidth: 350 }} placement="bottom-start">
        {taskLists.length > 1 && (
          <MenuItem
            selected={!activeTaskList}
            onClick={() => handleSetActiveList("")}
          >
            <ListItemDecorator>
              <DashboardIcon fontSize="small" />
            </ListItemDecorator>{" "}
            {t("All")}
          </MenuItem>
        )}
        {taskLists.length > 1 &&
          taskLists.map(({ filePath }) => (
            <MenuItem
              selected={activeTaskList?.filePath === filePath}
              onClick={() => handleSetActiveList(filePath)}
              key={filePath}
            >
              <ListItemDecorator>
                <InsertDriveFileOutlinedIcon fontSize="small" />
              </ListItemDecorator>
              <StartEllipsis variant="inherit">{filePath}</StartEllipsis>
            </MenuItem>
          ))}
        {taskLists.length > 0 && (
          <MenuItem onClick={handleManageFile}>
            <ListItemDecorator>
              <AllInboxRoundedIcon fontSize="small" />
            </ListItemDecorator>{" "}
            {t("Files…")}
          </MenuItem>
        )}
        {!touchScreen && taskLists.length > 1 && <Divider />}
        {!touchScreen && (
          <MenuItem onClick={handleKeyboardShortcutsClick}>
            <ListItemDecorator>
              <KeyboardIcon fontSize="small" />
            </ListItemDecorator>{" "}
            {t("Keyboard Shortcuts")}
          </MenuItem>
        )}
      </Menu>
    </Dropdown>
  );
}
