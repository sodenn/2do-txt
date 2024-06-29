import { StartEllipsis } from "@/components/StartEllipsis";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/images/logo.png";
import { hasTouchScreen } from "@/native-api/platform";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import { useTask } from "@/utils/useTask";
import {
  ChevronDownIcon,
  FileIcon,
  InboxIcon,
  KeyboardIcon,
  LayoutDashboardIcon,
  PlusIcon,
} from "lucide-react";
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
      <DropdownMenuCheckboxItem
        key="All"
        checked={!activeTaskList}
        onClick={() => handleSetActiveList("")}
      >
        <LayoutDashboardIcon className="h-4 w-4 mr-2" />
        {t("All")}
      </DropdownMenuCheckboxItem>,
    );
  }

  if (taskLists.length > 1) {
    taskLists.forEach(({ filePath }) => {
      menuItems.push(
        <DropdownMenuCheckboxItem
          checked={activeTaskList?.filePath === filePath}
          onClick={() => handleSetActiveList(filePath)}
          key={filePath}
        >
          <FileIcon className="h-4 w-4 mr-2" />
          <StartEllipsis>{filePath}</StartEllipsis>
        </DropdownMenuCheckboxItem>,
      );
    });
  }

  if (taskLists.length > 0) {
    menuItems.push(
      <DropdownMenuItem onClick={handleManageFile} key="Files…">
        <InboxIcon className="h-4 w-4 mr-2" />
        {t("Files…")}
      </DropdownMenuItem>,
    );
  }

  if (!touchScreen && taskLists.length > 1) {
    menuItems.push(<DropdownMenuSeparator key="divider" />);
  }

  if (!touchScreen) {
    menuItems.push(
      <DropdownMenuItem
        onClick={handleKeyboardShortcutsClick}
        key="Keyboard Shortcuts"
      >
        <KeyboardIcon className="h-4 w-4 mr-2" />
        {t("Keyboard Shortcuts")}
      </DropdownMenuItem>,
    );
  }

  if (menuItems.length === 1) {
    menuItems.push(
      <DropdownMenuItem onClick={handleCreateFile} key="Create file">
        <PlusIcon className="h-4 w-4 mr-2" />
        {t("Create")}
      </DropdownMenuItem>,
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          tabIndex={-1}
          className="max-w-[170px] lg:max-w-[300px]"
          color="primary"
          variant="secondary"
          aria-label="File menu"
        >
          <img src={logo} className="h-6 w-6 mr-2" alt="Logo" height={22} />
          <StartEllipsis>
            {activeTaskList ? activeTaskList.fileName : "2do.txt"}
          </StartEllipsis>
          <ChevronDownIcon className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">{menuItems}</DropdownMenuContent>
    </DropdownMenu>
  );
}
