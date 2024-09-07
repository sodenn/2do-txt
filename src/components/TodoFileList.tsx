import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { EndAdornment, List, ListItem } from "@/components/ui/list";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { writeToClipboard } from "@/utils/clipboard";
import { readFile } from "@/utils/filesystem";
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
  disabled: boolean;
}

interface FileMenuProps {
  id: number;
  onDownload: () => void;
  onClose: (id?: number) => void;
}

export const TodoFileList = memo(() => {
  const {
    taskLists,
    reorderTaskList,
    downloadTodoFile,
    closeTodoFile,
    createNewTodoFile,
    addTodoFile,
  } = useTask();
  const { t } = useTranslation();
  const { showOpenFilePicker, showSaveFilePicker } = useFilesystem();
  const [items, setItems] = useState(taskLists.map((t) => t.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // update items when a list was closed
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
    closeTodoFile(id);
  };

  const handleDownload = (id: number) => {
    const list = taskLists.find((t) => t.id === id);
    if (list) {
      downloadTodoFile([list]);
    }
  };

  const getFilename = (id: number) => {
    const list = taskLists.find((t) => t.id === id);
    return list ? list.filename : "";
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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="group space-y-2">
      <div className="relative">
        <Label>Lists</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              tabIndex={-1}
              variant="ghost"
              size="icon"
              onClick={handleOpenFile}
              className="absolute bottom-0 right-8 top-0 m-auto h-7 w-7 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
            >
              <FolderOpenIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("Open list")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              tabIndex={-1}
              variant="ghost"
              size="icon"
              onClick={handleCreateFile}
              className="absolute bottom-0 right-0 top-0 m-auto h-7 w-7 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("Create list")}</TooltipContent>
        </Tooltip>
      </div>
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
                disabled={items.length < 2}
              />
            ))}
          </SortableContext>
        </DndContext>
      </List>
    </div>
  );
});

function FileListItem(props: FileListItemProps) {
  const { id, filename, onClose, onDownload, disabled } = props;
  const { t } = useTranslation();
  const {
    attributes: { role, ...attributes },
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ disabled, id });
  const { openConfirmationDialog } = useConfirmationDialogStore();
  const { selectedTaskLists, toggleTaskList } = useTask();
  const selectedTaskListIds = selectedTaskLists.map((list) => list.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const openDeleteConfirmationDialog = () => {
    openConfirmationDialog({
      title: t("Remove list"),
      content: <Trans i18nKey="Remove x" values={{ filename }} />,
      buttons: [
        {
          text: t("Cancel"),
          variant: "secondary",
        },
        {
          text: t("Remove"),
          handler: () => {
            onClose(id);
          },
        },
      ],
    });
  };

  return (
    <ListItem
      aria-label="Task list"
      clickable={false}
      ref={setNodeRef}
      style={style}
      data-testid="draggable-list"
      tabIndex={-1}
      className="group sm:gap-0"
      endAdornment={
        <FileMenu
          id={id}
          onClose={openDeleteConfirmationDialog}
          onDownload={() => onDownload(id)}
        />
      }
    >
      <div className="flex min-w-0 items-center gap-4">
        {!disabled && (
          <>
            <Checkbox
              id={`list-${id}`}
              checked={selectedTaskListIds.includes(id)}
              onCheckedChange={() => toggleTaskList(id)}
            />
            <Label htmlFor={`list-${id}`} className="truncate">
              {filename}
            </Label>
          </>
        )}
        {disabled && filename}
      </div>
      <div className="flex-1" />
      <div
        {...listeners}
        {...attributes}
        aria-label={`Draggable list ${filename}`}
        tabIndex={-1}
      >
        <GripVerticalIcon
          className={cn(
            disabled && "hidden",
            "ml-2 mr-1 h-4 w-4 cursor-move opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-50",
          )}
        />
      </div>
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
        <EndAdornment>
          <Button
            role="button"
            size="icon"
            variant="ghost"
            aria-label="List actions"
            aria-haspopup="true"
            className="h-7 w-7"
          >
            <EllipsisVertical className="h-4 w-4 opacity-50" />
          </Button>
        </EndAdornment>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          <ClipboardIcon className="mr-2 h-4 w-4" />
          {t("Copy to clipboard")}
        </DropdownMenuItem>
        <DropdownMenuItem aria-label="Download list" onClick={onDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          {t("Download")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCloseFile} aria-label="Remove list">
          <XIcon className="mr-2 h-4 w-4" />
          {t("Remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
