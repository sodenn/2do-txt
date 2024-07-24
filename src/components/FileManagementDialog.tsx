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
import { writeToClipboard } from "@/native-api/clipboard";
import { fileExists, getFilename, readFile } from "@/native-api/filesystem";
import { hasTouchScreen } from "@/native-api/platform";
import { useCloudFileDialogStore } from "@/stores/cloud-file-dialog-store";
import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { usePlatformStore } from "@/stores/platform-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  CloudFileRef,
  CloudStorageError,
  Provider,
  WithIdentifier,
  cloudStorageIcons,
  useCloudStorage,
} from "@/utils/CloudStorage";
import { formatLocalDateTime, parseDate } from "@/utils/date";
import { getDoneFilePath } from "@/utils/todo-files";
import { cn } from "@/utils/tw-utils";
import { useFilePicker } from "@/utils/useFilePicker";
import { useTask } from "@/utils/useTask";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  ClipboardIcon,
  CloudOffIcon,
  DownloadIcon,
  EllipsisVertical,
  FolderOpenIcon,
  GripVerticalIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCcwIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import React, { memo, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

type CloudFileRefWithIdentifier = CloudFileRef & WithIdentifier;

interface FileListProps {
  onClose: (filePath: string) => void;
}

interface FileListItemProps {
  filePath: string;
  onClose: (filePath: string) => void;
  onDownload: (filePath: string) => void;
  disableDrag: boolean;
}

interface FileMenuProps {
  filePath: string;
  cloudFileRef?: CloudFileRefWithIdentifier;
  onChange: (cloudFileRef?: CloudFileRefWithIdentifier) => void;
  onDownload: () => void;
  onClose: (filePath?: string) => void;
}

interface CloudSyncMenuItemProps {
  identifier: string;
  provider: Provider;
  onChange: (cloudFileRef: CloudFileRefWithIdentifier) => void;
}

interface EnableCloudSyncMenuItemProps {
  provider: Provider;
  filePath: string;
  onChange: (cloudFileRef?: CloudFileRefWithIdentifier) => void;
  onLoad: (loading: boolean) => void;
  cloudFileRef?: CloudFileRefWithIdentifier;
}

function useShouldDeleteFile() {
  const platform = usePlatformStore((state) => state.platform);
  return platform === "web" || platform === "ios" || platform === "android";
}

export function FileManagementDialog() {
  const fileManagementDialogOpen = useFileManagementDialogStore(
    (state) => state.open,
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { t } = useTranslation();
  const { taskLists } = useTask();

  const handleCloseFile = async () => {
    if (taskLists.length === 1) {
      closeFileManagementDialog();
    }
  };

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
          <FileList onClose={handleCloseFile} />
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
  const platform = usePlatformStore((state) => state.platform);
  const { openFileDialog } = useFilePicker();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { cloudStorages } = useCloudStorage();
  const openCloudFileDialog = useCloudFileDialogStore(
    (state) => state.openCloudFileDialog,
  );

  const handleCreateFile = () => {
    openFileCreateDialog();
    closeFileManagementDialog();
  };

  const handleOpenFile = () => {
    openFileDialog();
    closeFileManagementDialog();
  };

  const handleImportFromStorage = (provider: Provider) => {
    // first, close the file management dialog to correctly set the aria-hidden attribute
    closeFileManagementDialog();
    setTimeout(() => {
      openCloudFileDialog(provider);
    });
  };

  const renderCloudStorageIcon = (provider: Provider) => {
    const icon = cloudStorageIcons[provider];
    return React.isValidElement<{ fontSize?: string }>(icon)
      ? React.cloneElement(icon, {
          fontSize: "small",
        })
      : icon;
  };

  if (cloudStorages.length === 0) {
    return (
      <>
        <Button tabIndex={-1} variant="secondary" onClick={handleOpenFile}>
          {platform === "desktop" ? t("Open") : t("Import")}
        </Button>
        <Button onClick={handleCreateFile}>{t("Create")}</Button>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          tabIndex={0}
          variant="outline"
          className="w-full justify-start"
          aria-label="Choose action"
        >
          {t("Choose action")}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCreateFile}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("Create")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenFile}>
          <FolderOpenIcon className="mr-2 h-4 w-4" />
          {platform === "desktop" ? t("Open") : t("Import")}
        </DropdownMenuItem>
        {cloudStorages
          .map((s) => s.provider)
          .map((provider) => (
            <DropdownMenuItem
              key={provider}
              onClick={() => handleImportFromStorage(provider)}
            >
              {renderCloudStorageIcon(provider)}
              {t("Cloud storage")}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const FileList = memo((props: FileListProps) => {
  const { onClose } = props;
  const { taskLists, reorderTaskList, downloadTodoFile, closeTodoFile } =
    useTask();
  const { unlinkCloudFile } = useCloudStorage();
  const [items, setItems] = useState(taskLists.map((t) => t.filePath));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // update list items when a file was closed/deleted
  useEffect(() => {
    setItems(taskLists.map((t) => t.filePath));
  }, [taskLists]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newItems = arrayMove(items, oldIndex, newIndex);
        reorderTaskList(newItems);
        return newItems;
      });
    }
  };

  const handleCloseFile = async (filePath: string) => {
    onClose(filePath);
    closeTodoFile(filePath);
    await unlinkCloudFile(filePath);
  };

  const handleDownload = (filePath: string) => {
    downloadTodoFile(taskLists.find((t) => t.filePath === filePath));
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
          {items.map((filePath) => (
            <FileListItem
              key={filePath}
              filePath={filePath}
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
  const { filePath, onClose, onDownload, disableDrag } = props;
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [showCloseConfirmButton, setShowCloseConfirmButton] = useState(false);
  const language = useSettingsStore((state) => state.language);
  const { getCloudFileRef } = useCloudStorage();
  const [cloudFileRef, setCloudFileRef] =
    useState<CloudFileRefWithIdentifier>();
  const cloudFileLastModified = cloudFileRef
    ? parseDate(cloudFileRef.lastSync)
    : undefined;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ disabled: disableDrag, id: filePath });
  const deleteFile = useShouldDeleteFile();
  const { t } = useTranslation();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    getCloudFileRef(filePath).then(setCloudFileRef);
  }, [filePath, getCloudFileRef]);

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      role="listitem"
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
            {deleteFile ? (
              <Trans
                i18nKey="Delete file"
                values={{ fileName: getFilename(filePath) }}
              />
            ) : (
              <Trans
                i18nKey="Close file"
                values={{ fileName: getFilename(filePath) }}
              />
            )}
          </div>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="m-[1px] flex-shrink-0"
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
                  tabIndex={-1}
                  onClick={() => {
                    onClose(filePath);
                    setShowCloseConfirmButton(false);
                  }}
                >
                  {deleteFile && <TrashIcon className="h-4 w-4" />}
                  {!deleteFile && <CheckIcon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {deleteFile ? t("Delete") : t("Close")}
              </TooltipContent>
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
            aria-label={`Draggable file ${filePath}`}
            tabIndex={-1}
          >
            <GripVerticalIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-1 items-center overflow-auto">
            <div className="truncate">{filePath}</div>
            {cloudFileRef && (
              <div className="flex items-center gap-1">
                <RefreshCcwIcon className="mr-2 h-4 w-4" />
                <div className="text-sm text-muted-foreground">
                  {cloudFileLastModified &&
                    formatLocalDateTime(cloudFileLastModified, language)}
                </div>
              </div>
            )}
          </div>
          <div>
            <FileMenu
              filePath={filePath}
              cloudFileRef={cloudFileRef}
              onChange={setCloudFileRef}
              onClose={() => {
                setShowCloseButton(false);
              }}
              onDownload={() => onDownload(filePath)}
            />
          </div>
        </div>
      </Fade>
    </ListItem>
  );
}

function CloudSyncMenuItem(opt: CloudSyncMenuItemProps) {
  const { onChange, identifier, provider } = opt;
  const { t } = useTranslation();
  const { syncFile, getCloudFileRef } = useCloudStorage();
  const { parseTaskList } = useTask();

  const handleClick = async () => {
    const content = await syncFile(identifier);
    if (content) {
      parseTaskList(identifier, content);
    }
    getCloudFileRef(identifier).then(onChange);
  };

  return (
    <DropdownMenuItem onClick={handleClick}>
      {cloudStorageIcons[provider]}
      {t("Sync with cloud storage", {
        provider: provider,
      })}
    </DropdownMenuItem>
  );
}

function EnableCloudSyncMenuItem(props: EnableCloudSyncMenuItemProps) {
  const { provider, filePath, cloudFileRef, onChange, onLoad } = props;
  const { t } = useTranslation();
  const { cloudStorages, cloudStorageEnabled, uploadFile, unlinkCloudFile } =
    useCloudStorage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const enableCloudSync = async () => {
    try {
      setLoading(true);
      onLoad(true);

      if (!cloudFileRef) {
        const todoFileData = await readFile(filePath);
        const ref = await uploadFile(provider, filePath, todoFileData);
        const doneFilePath = getDoneFilePath(filePath);
        if (doneFilePath) {
          const doneFileExists = await fileExists(doneFilePath);
          if (doneFileExists) {
            const doneFileData = await readFile(doneFilePath);
            await uploadFile(provider, doneFilePath, doneFileData).catch(
              (e) => void e,
            );
          }
        }
        onChange(ref);
      } else {
        await unlinkCloudFile(filePath);
        onChange(undefined);
      }
    } catch (e: any) {
      if (!(e instanceof CloudStorageError && e.type === "Unauthorized")) {
        console.debug(e);
        toast({
          variant: "warning",
          description: (
            <Trans
              i18nKey="Error syncing file to cloud storage"
              values={{ provider, message: e.message }}
              components={{ code: <code style={{ marginLeft: 5 }} /> }}
            />
          ),
        });
      }
    } finally {
      setLoading(false);
      onLoad(false);
    }
  };

  if (
    !cloudStorageEnabled ||
    (cloudStorages.every((s) => s.provider !== provider) && !cloudFileRef)
  ) {
    return null;
  }

  const buttonText = cloudFileRef
    ? t("Disable cloud storage sync", {
        provider,
      })
    : t("Enable cloud storage sync", {
        provider,
      });

  return (
    <DropdownMenuItem onClick={enableCloudSync} disabled={loading}>
      {loading && <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && !cloudFileRef && cloudStorageIcons[provider]}
      {!loading && cloudFileRef && <CloudOffIcon className="mr-2 h-4 w-4" />}
      {buttonText}
    </DropdownMenuItem>
  );
}

function FileMenu(props: FileMenuProps) {
  const { filePath, cloudFileRef, onChange, onDownload, onClose } = props;
  const { cloudStorages } = useCloudStorage();
  const touchScreen = hasTouchScreen();
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { toast } = useToast();
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const deleteFile = useShouldDeleteFile();
  const providers = useMemo(() => {
    const value = [...cloudStorages.map((s) => s.provider)];
    if (cloudFileRef && !value.includes(cloudFileRef.provider)) {
      value.push(cloudFileRef.provider);
    }
    return value;
  }, [cloudFileRef, cloudStorages]);
  const showCloudSyncMenuItem = cloudFileRef && !touchScreen;
  const showCopyToClipboardMenuItem =
    platform === "desktop" || platform === "web";
  const showDownloadMenuItem = platform === "web";
  const showEnableCloudSyncMenuItem = providers.length > 0;

  const handleCloseFile = () => {
    onClose(filePath);
  };

  const handleCopyToClipboard = () => {
    const promise = readFile(filePath);
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

  if (
    !showCloudSyncMenuItem &&
    !showCopyToClipboardMenuItem &&
    !showDownloadMenuItem &&
    !showEnableCloudSyncMenuItem
  ) {
    return (
      <Button size="icon" onClick={handleCloseFile} aria-label="Delete file">
        {deleteFile && <TrashIcon />}
        {!deleteFile && <XIcon />}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          tabIndex={-1}
          size="icon"
          variant="ghost"
          aria-label="File actions"
          aria-haspopup="true"
          disabled={cloudSyncLoading}
          className="m-[1px]"
        >
          {!cloudSyncLoading && <EllipsisVertical className="h-4 w-4" />}
          {cloudSyncLoading && (
            <LoaderCircleIcon className="h-4 w-4 animate-spin opacity-30" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showCloudSyncMenuItem && (
          <CloudSyncMenuItem
            identifier={cloudFileRef.identifier}
            provider={cloudFileRef.provider}
            onChange={onChange}
          />
        )}
        {providers.map((provider) => (
          <EnableCloudSyncMenuItem
            key={provider}
            provider={provider}
            onChange={onChange}
            filePath={filePath}
            onLoad={setCloudSyncLoading}
            cloudFileRef={
              cloudFileRef?.provider === provider ? cloudFileRef : undefined
            }
          />
        ))}
        {showCopyToClipboardMenuItem && (
          <DropdownMenuItem onClick={handleCopyToClipboard}>
            <ClipboardIcon className="mr-2 h-4 w-4" />
            {t("Copy to clipboard")}
          </DropdownMenuItem>
        )}
        {showDownloadMenuItem && (
          <DropdownMenuItem aria-label="Download todo.txt" onClick={onDownload}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            {t("Download")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCloseFile} aria-label="Delete file">
          {deleteFile && <TrashIcon className="mr-2 h-4 w-4" />}
          {!deleteFile && <TrashIcon className="mr-2 h-4 w-4" />}
          {deleteFile ? t("Delete") : t("Close")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
