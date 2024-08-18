import { Fade } from "@/components/Fade";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List, ListItem } from "@/components/ui/list";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogHiddenDescription,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { writeToClipboard } from "@/utils/clipboard";
import { readFile } from "@/utils/filesystem";
import { SUPPORTS_SHOW_OPEN_FILE_PICKER } from "@/utils/platform";
import { cn } from "@/utils/tw-utils";
import { useFilesystem } from "@/utils/useFilesystem";
import { useTask } from "@/utils/useTask";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  EllipsisVertical,
  FolderOpenIcon,
  GripVerticalIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface FileListItemProps {
  id: number;
  filename: string;
  onClose: (id: number) => void;
  onDownload: (id: number) => void;
  disableDrag: boolean;
}

interface FileMenuProps {
  id: number;
  onDownload: () => void;
  onClose: (id?: number) => void;
}

export function FileManagementDialog() {
  const fileManagementDialogOpen = useFileManagementDialogStore(
    (state) => state.open,
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { t } = useTranslation();

  return (
    <ResponsiveDialog
      open={fileManagementDialogOpen}
      onClose={closeFileManagementDialog}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("Files")}</ResponsiveDialogTitle>
          <ResponsiveDialogHiddenDescription>
            Files
          </ResponsiveDialogHiddenDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <FileList />
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <FileManagementActions />
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function FileManagementActions() {
  const { t } = useTranslation();
  const { createNewTodoFile, addTodoFile } = useTask();
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { showOpenFilePicker, showSaveFilePicker } = useFilesystem();

  const handleCreateFile = async () => {
    closeFileManagementDialog();
    const result = await showSaveFilePicker();
    if (result) {
      createNewTodoFile(result.id, "");
    }
  };

  const handleOpenFile = async () => {
    closeFileManagementDialog();
    const result = await showOpenFilePicker();
    if (result) {
      addTodoFile(result.id, result.filename, result.content);
    }
  };

  return (
    <>
      <Button
        tabIndex={-1}
        variant="secondary"
        onClick={handleOpenFile}
        aria-label={
          SUPPORTS_SHOW_OPEN_FILE_PICKER ? "Open todo.txt" : "Import todo.txt"
        }
      >
        <FolderOpenIcon className="mr-2 h-4 w-4" />
        {SUPPORTS_SHOW_OPEN_FILE_PICKER ? t("Open") : t("Import")}
      </Button>
      <Button tabIndex={-1} onClick={handleCreateFile}>
        <PlusIcon className="mr-2 h-4 w-4" />
        {t("Create")}
      </Button>
    </>
  );
}

const FileList = memo(() => {
  const { taskLists, reorderTaskList, downloadTodoFile, closeTodoFile } =
    useTask();
  const [items, setItems] = useState(taskLists.map((t) => t.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );

  // update list items when a file was closed/deleted
  useEffect(() => {
    setItems(taskLists.map((t) => t.id));
  }, [taskLists]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as number);
        const newIndex = items.indexOf(over.id as number);
        const newItems = arrayMove(items, oldIndex, newIndex);
        reorderTaskList(newItems);
        return newItems;
      });
    }
  };

  const handleCloseFile = async (id: number) => {
    if (taskLists.length === 1) {
      closeFileManagementDialog();
    }
    closeTodoFile(id);
  };

  const handleDownload = (id: number) => {
    downloadTodoFile(taskLists.find((t) => t.id === id));
  };

  const getFilename = (id: number) => {
    const list = taskLists.find((t) => t.id === id);
    return list ? list.filename : "";
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <List variant="outline">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((id) => (
            <FileListItem
              key={id}
              id={id}
              filename={getFilename(id)}
              onDownload={handleDownload}
              onClose={handleCloseFile}
              disableDrag={items.length === 1}
            />
          ))}
        </SortableContext>
      </DndContext>
    </List>
  );
});

function FileListItem(props: FileListItemProps) {
  const { id, filename, onClose, onDownload, disableDrag } = props;
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [showCloseConfirmButton, setShowCloseConfirmButton] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ disabled: disableDrag, id });
  const { t } = useTranslation();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      clickable={!disableDrag}
      tabIndex={-1}
      ref={setNodeRef}
      style={style}
      data-testid="draggable-file"
    >
      <Fade
        duration={150}
        in={showCloseConfirmButton}
        unmountOnExit
        onExited={() => setShowCloseButton(true)}
      >
        <div className="flex flex-1 items-center gap-1 overflow-hidden">
          <div className="flex-1 truncate whitespace-pre">
            <Trans i18nKey="Close file" values={{ filename }} />
          </div>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="m-[1px] flex-shrink-0"
                  aria-label="Cancel"
                  tabIndex={-1}
                  onClick={() => {
                    setShowCloseConfirmButton(false);
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("Cancel")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="m-[1px] flex-shrink-0"
                  aria-label="Close file confirmation"
                  onClick={() => {
                    onClose(id);
                    setShowCloseConfirmButton(false);
                  }}
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("Close")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Fade>
      <Fade
        duration={150}
        in={showCloseButton}
        unmountOnExit
        onExited={() => setShowCloseConfirmButton(true)}
      >
        <div className="flex flex-1 items-center gap-1 overflow-hidden">
          <div
            {...listeners}
            {...attributes}
            className={cn(
              "flex-shrink-0 cursor-pointer p-1",
              showCloseConfirmButton || disableDrag ? "hidden" : "inline-flex",
            )}
            aria-label={`Draggable file ${filename}`}
            tabIndex={-1}
          >
            <GripVerticalIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-1 items-center overflow-auto">
            <div className="truncate">{filename}</div>
          </div>
          <div>
            <FileMenu
              id={id}
              onClose={() => {
                setShowCloseButton(false);
              }}
              onDownload={() => onDownload(id)}
            />
          </div>
        </div>
      </Fade>
    </ListItem>
  );
}

function FileMenu(props: FileMenuProps) {
  const { id, onDownload, onClose } = props;
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleCloseFile = () => {
    onClose(id);
  };

  const handleCopyToClipboard = () => {
    const promise = readFile(id).then(
      ({ content }) => content,
    ) as Promise<string>;
    writeToClipboard(promise)
      .then(() => toast({ description: t("Copied to clipboard") }))
      .catch((e) => {
        console.log(e);
        toast({
          variant: "danger",
          description: t("Copy to clipboard failed"),
        });
      })
      .finally();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="File actions"
          aria-haspopup="true"
          className="m-[1px]"
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          <ClipboardIcon className="mr-2 h-4 w-4" />
          {t("Copy to clipboard")}
        </DropdownMenuItem>
        <DropdownMenuItem aria-label="Download todo.txt" onClick={onDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          {t("Download")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCloseFile} aria-label="Close file">
          <XIcon className="mr-2 h-4 w-4" />
          {t("Close")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
