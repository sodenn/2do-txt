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
import { useToast } from "@/components/ui/use-toast";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useFilterStore } from "@/stores/filter-store";
import { writeToClipboard } from "@/utils/clipboard";
import { readFile } from "@/utils/filesystem";
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
  disableDrag: boolean;
}

interface FileMenuProps {
  id: number;
  onDownload: () => void;
  onClose: (id?: number) => void;
}

export const FileList = memo(() => {
  const {
    taskLists,
    reorderTaskList,
    downloadTodoFile,
    closeTodoFile,
    createNewTodoFile,
    addTodoFile,
  } = useTask();
  const { showOpenFilePicker, showSaveFilePicker } = useFilesystem();
  const [items, setItems] = useState(taskLists.map((t) => t.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    closeTodoFile(id);
  };

  const handleDownload = (id: number) => {
    const list = taskLists.find((t) => t.id === id);
    if (list) {
      downloadTodoFile(list);
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenFile}
          className="absolute bottom-0 right-8 top-0 m-auto h-7 w-7 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
        >
          <FolderOpenIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateFile}
          className="absolute bottom-0 right-0 top-0 m-auto h-7 w-7 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
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
                disableDrag={items.length === 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      </List>
    </div>
  );
});

function FileListItem(props: FileListItemProps) {
  const { id, filename, onClose, onDownload, disableDrag } = props;
  const { t } = useTranslation();
  const {
    attributes: { role, ...attributes },
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ disabled: disableDrag, id });
  const { openConfirmationDialog } = useConfirmationDialogStore();
  const selectedTaskListIds = useFilterStore(
    (state) => state.selectedTaskListIds,
  );
  const toggleTaskListId = useFilterStore((state) => state.toggleTaskListId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const openDeleteConfirmationDialog = () => {
    openConfirmationDialog({
      title: t("Remove list"),
      content: <Trans i18nKey="Remove list x" values={{ filename }} />,
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
      clickable={false}
      ref={setNodeRef}
      style={style}
      data-testid="draggable-file"
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
      <div className="flex min-w-0 items-center space-x-2">
        <Checkbox
          id={`list-${id}`}
          checked={selectedTaskListIds.includes(id)}
          onCheckedChange={() => toggleTaskListId(id)}
        />
        <Label htmlFor={`list-${id}`} className="mr-2 truncate">
          {filename}
        </Label>
      </div>
      <div className="flex-1" />
      <div {...listeners} {...attributes}>
        <GripVerticalIcon className="ml-2 mr-1 h-4 w-4 cursor-move opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-50" />
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
            aria-label="File actions"
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
