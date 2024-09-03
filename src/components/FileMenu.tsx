import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFilterStore } from "@/stores/filter-store";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import {
  HAS_TOUCHSCREEN,
  SUPPORTS_SHOW_OPEN_FILE_PICKER,
} from "@/utils/platform";
import { useFilesystem } from "@/utils/useFilesystem";
import { useTask } from "@/utils/useTask";
import {
  ChevronDownIcon,
  FolderOpenIcon,
  KeyboardIcon,
  PlusIcon,
} from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import logo from "/logo.png";

export function FileMenu() {
  const { t } = useTranslation();
  const openShortcutsDialog = useShortcutsDialogStore(
    (state) => state.openShortcutsDialog,
  );
  const { taskLists, activeTaskList, createNewTodoFile, addTodoFile } =
    useTask();
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  const { showOpenFilePicker, showSaveFilePicker } = useFilesystem();

  const handleKeyboardShortcutsClick = () => {
    openShortcutsDialog();
  };

  const handleCreateFile = async () => {
    const result = await showSaveFilePicker();
    if (result) {
      createNewTodoFile(result.id, "");
    }
  };

  const handleOpenFile = async () => {
    const result = await showOpenFilePicker();
    if (result) {
      addTodoFile(result.id, result.filename, result.content);
    }
  };

  const handleSetActiveList = async (id?: number) => {
    setActiveTaskListId(id);
  };

  const menuItems: ReactNode[] = [];

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

  menuItems.push(<DropdownMenuSeparator key="divider1" />);

  menuItems.push(
    <DropdownMenuItem onClick={handleCreateFile} key="Create file">
      <PlusIcon className="mr-2 h-4 w-4" />
      {t("Create")}
    </DropdownMenuItem>,
  );

  menuItems.push(
    <DropdownMenuItem
      onClick={handleOpenFile}
      key="Open file"
      aria-label={
        SUPPORTS_SHOW_OPEN_FILE_PICKER ? "Open todo.txt" : "Import todo.txt"
      }
    >
      <FolderOpenIcon className="mr-2 h-4 w-4" />
      {SUPPORTS_SHOW_OPEN_FILE_PICKER ? t("Open") : t("Import")}
    </DropdownMenuItem>,
  );

  if (!HAS_TOUCHSCREEN) {
    menuItems.push(<DropdownMenuSeparator key="divider2" />);
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
