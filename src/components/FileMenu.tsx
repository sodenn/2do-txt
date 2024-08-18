import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import { HAS_TOUCHSCREEN } from "@/utils/platform";
import { useFilesystem } from "@/utils/useFilesystem";
import { useTask } from "@/utils/useTask";
import {
  ChevronDownIcon,
  InboxIcon,
  KeyboardIcon,
  PlusIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import logo from "/logo.png";

export function FileMenu() {
  const { t } = useTranslation();
  const openFileManagementDialog = useFileManagementDialogStore(
    (state) => state.openFileManagementDialog,
  );
  const openShortcutsDialog = useShortcutsDialogStore(
    (state) => state.openShortcutsDialog,
  );
  const { taskLists, activeTaskList, createNewTodoFile } = useTask();
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  const { showSaveFilePicker } = useFilesystem();

  const handleSetActiveList = async (id?: number) => {
    setActiveTaskListId(id);
  };

  const handleManageFile = () => {
    openFileManagementDialog();
  };

  const handleKeyboardShortcutsClick = () => {
    openShortcutsDialog();
  };

  const handleCreateFile = async () => {
    const result = await showSaveFilePicker();
    if (result) {
      createNewTodoFile(result.id, "");
    }
  };

  const menuItems: ReactNode[] = [];

  if (taskLists.length > 1) {
    menuItems.push(
      <DropdownMenuCheckboxItem
        key="All"
        aria-label="All task lists"
        checked={!activeTaskList}
        onClick={() => handleSetActiveList()}
      >
        {t("All")}
      </DropdownMenuCheckboxItem>,
    );
  }

  if (taskLists.length > 1) {
    taskLists.forEach(({ id, filename }) => {
      menuItems.push(
        <DropdownMenuCheckboxItem
          checked={activeTaskList?.id === id}
          onClick={() => handleSetActiveList(id)}
          key={id}
        >
          <div className="truncate">{filename}</div>
        </DropdownMenuCheckboxItem>,
      );
    });
  }

  if (taskLists.length > 0) {
    menuItems.push(
      <DropdownMenuItem onClick={handleManageFile} key="Files…">
        <InboxIcon className="mr-2 h-4 w-4" />
        {t("Files…")}
      </DropdownMenuItem>,
    );
  }

  if (!HAS_TOUCHSCREEN && taskLists.length > 1) {
    menuItems.push(<DropdownMenuSeparator key="divider" />);
  }

  if (!HAS_TOUCHSCREEN) {
    menuItems.push(
      <DropdownMenuItem
        onClick={handleKeyboardShortcutsClick}
        key="Keyboard Shortcuts"
      >
        <KeyboardIcon className="mr-2 h-4 w-4" />
        {t("Keyboard Shortcuts")}
      </DropdownMenuItem>,
    );
  }

  if (menuItems.length === 1) {
    menuItems.push(
      <DropdownMenuItem onClick={handleCreateFile} key="Create file">
        <PlusIcon className="mr-2 h-4 w-4" />
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
          variant="outline"
          aria-label="File menu"
        >
          <img src={logo} className="mr-2 h-6 w-6" alt="Logo" height={22} />
          <div className="truncate">
            {activeTaskList ? activeTaskList.filename : "2do.txt"}
          </div>
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">{menuItems}</DropdownMenuContent>
    </DropdownMenu>
  );
}
