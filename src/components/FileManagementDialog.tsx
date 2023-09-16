import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { useSnackbar } from "@/components/Snackbar";
import { StartEllipsis } from "@/components/StartEllipsis";
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
import { useDialogButtonSize } from "@/utils/useDialogButtonSize";
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
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SyncIcon from "@mui/icons-material/Sync";
import {
  Box,
  Button,
  CircularProgress,
  Dropdown,
  IconButton,
  List,
  ListItem,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
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
  markedForClosing?: string;
  onMarkedForClosing: (filePath?: string) => void;
  disableDrag: boolean;
}

interface FileMenuProps {
  filePath: string;
  cloudFileRef?: CloudFileRefWithIdentifier;
  onChange: (cloudFileRef?: CloudFileRefWithIdentifier) => void;
  onDownloadClick: () => void;
  onMarkedForClosing: (filePath?: string) => void;
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
      fullWidth
      fullScreen={false}
      open={fileManagementDialogOpen}
      onClose={closeFileManagementDialog}
    >
      <ResponsiveDialogTitle>{t("Files")}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <FileList onClose={handleCloseFile} />
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <FileManagementActions />
      </ResponsiveDialogActions>
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
  const buttonSize = useDialogButtonSize();

  const handleCreateFile = () => {
    openFileCreateDialog();
    closeFileManagementDialog();
  };

  const handleOpenFile = () => {
    openFileDialog();
    closeFileManagementDialog();
  };

  const handleImportFromStorage = (provider: Provider) => {
    openCloudFileDialog(provider);
    closeFileManagementDialog();
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
        <Button size={buttonSize} onClick={handleOpenFile}>
          {platform === "desktop" ? t("Open") : t("Import")}
        </Button>
        <Button size={buttonSize} onClick={handleCreateFile}>
          {t("Create")}
        </Button>
      </>
    );
  }

  return (
    <Dropdown>
      <MenuButton
        color="primary"
        variant="solid"
        size={buttonSize}
        aria-label="Choose action"
        endDecorator={<ArrowDropDownIcon />}
      >
        {t("Choose action")}
      </MenuButton>
      <Menu placement="bottom-end">
        <MenuItem onClick={handleCreateFile}>
          <ListItemDecorator>
            <AddIcon />
          </ListItemDecorator>
          {t("Create")}
        </MenuItem>
        <MenuItem onClick={handleOpenFile}>
          <ListItemDecorator>
            <FolderOpenIcon />
          </ListItemDecorator>
          {platform === "desktop" ? t("Open") : t("Import")}
        </MenuItem>
        {cloudStorages
          .map((s) => s.provider)
          .map((provider) => (
            <MenuItem
              key={provider}
              onClick={() => handleImportFromStorage(provider)}
            >
              <ListItemDecorator>
                {renderCloudStorageIcon(provider)}
              </ListItemDecorator>
              {t("Cloud storage")}
            </MenuItem>
          ))}
      </Menu>
    </Dropdown>
  );
}

const FileList = memo((props: FileListProps) => {
  const { onClose, ...other } = props;
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
  const [markedForClosing, setMarkedForClosing] = useState<string>();

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
    <List variant="outlined" sx={{ borderRadius: "sm" }} {...other}>
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
              markedForClosing={markedForClosing}
              onMarkedForClosing={setMarkedForClosing}
              disableDrag={items.length === 1}
            />
          ))}
        </SortableContext>
      </DndContext>
    </List>
  );
});

function FileListItem(props: FileListItemProps) {
  const {
    filePath,
    markedForClosing,
    onClose,
    onMarkedForClosing,
    onDownload,
    disableDrag,
  } = props;
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
  const showClosePrompt = markedForClosing === filePath;

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
      endAction={
        showClosePrompt ? (
          <Stack spacing={1} direction="row">
            <Tooltip title={t("Cancel")}>
              <IconButton
                color="neutral"
                onClick={() => onMarkedForClosing(undefined)}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={deleteFile ? t("Delete") : t("Close")}>
              <IconButton color="danger" onClick={() => onClose(filePath)}>
                {deleteFile && <DeleteForeverIcon />}
                {!deleteFile && <CloseIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          <FileMenu
            filePath={filePath}
            cloudFileRef={cloudFileRef}
            onChange={setCloudFileRef}
            onMarkedForClosing={onMarkedForClosing}
            onDownloadClick={() => onDownload(filePath)}
          />
        )
      }
      role="listitem"
      data-testid="draggable-file"
    >
      <ListItemDecorator
        {...listeners}
        {...attributes}
        sx={{
          cursor: "pointer",
          display: showClosePrompt || disableDrag ? "none" : "inline-flex",
        }}
        aria-label={`Draggable file ${filePath}`}
      >
        <DragIndicatorIcon />
      </ListItemDecorator>
      {!showClosePrompt && (
        <Box sx={{ overflow: "hidden" }}>
          <StartEllipsis>{filePath}</StartEllipsis>
          {cloudFileRef && (
            <Stack spacing={1} direction="row" alignItems="center">
              <SyncIcon fontSize="inherit" />
              <Typography level="body-sm">
                {cloudFileLastModified &&
                  formatLocalDateTime(cloudFileLastModified, language)}
              </Typography>
            </Stack>
          )}
        </Box>
      )}
      {showClosePrompt && (
        <Typography>
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
        </Typography>
      )}
    </ListItem>
  );
}

function CloudSyncMenuItem(opt: CloudSyncMenuItemProps) {
  const { onChange, identifier, provider } = opt;
  const { t } = useTranslation();
  const { syncFile, getCloudFileRef } = useCloudStorage();
  const { loadTodoFile } = useTask();

  const handleClick = async () => {
    const content = await syncFile(identifier);
    if (content) {
      loadTodoFile(identifier, content);
    }
    getCloudFileRef(identifier).then(onChange);
  };

  return (
    <MenuItem onClick={handleClick}>
      <ListItemDecorator>{cloudStorageIcons[provider]}</ListItemDecorator>
      <Typography>
        {t("Sync with cloud storage", {
          provider: provider,
        })}
      </Typography>
    </MenuItem>
  );
}

function EnableCloudSyncMenuItem(props: EnableCloudSyncMenuItemProps) {
  const { provider, filePath, cloudFileRef, onChange, onLoad } = props;
  const { t } = useTranslation();
  const { cloudStorages, cloudStorageEnabled, uploadFile, unlinkCloudFile } =
    useCloudStorage();
  const { openSnackbar } = useSnackbar();
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
        openSnackbar({
          color: "warning",
          message: (
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
    <MenuItem onClick={enableCloudSync} disabled={loading}>
      <ListItemDecorator>
        {loading && <CircularProgress size="sm" />}
        {!loading && !cloudFileRef && cloudStorageIcons[provider]}
        {!loading && cloudFileRef && <CloudOffRoundedIcon />}
      </ListItemDecorator>
      <Typography>{buttonText}</Typography>
    </MenuItem>
  );
}

function FileMenu(props: FileMenuProps) {
  const {
    filePath,
    cloudFileRef,
    onChange,
    onMarkedForClosing,
    onDownloadClick,
  } = props;
  const { cloudStorages } = useCloudStorage();
  const touchScreen = hasTouchScreen();
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { openSnackbar } = useSnackbar();
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const deleteFile = useShouldDeleteFile();
  const providers = useMemo(() => {
    const value = [...cloudStorages.map((s) => s.provider)];
    if (cloudFileRef && !value.includes(cloudFileRef.provider)) {
      value.push(cloudFileRef.provider);
    }
    return value;
  }, [cloudFileRef, cloudStorages]);

  const handleCloseFile = () => {
    onMarkedForClosing(filePath);
  };

  const handleCopyToClipboard = () => {
    const promise = readFile(filePath);
    writeToClipboard(promise)
      .then(() =>
        openSnackbar({ color: "primary", message: t("Copied to clipboard") }),
      )
      .catch(() =>
        openSnackbar({
          color: "danger",
          message: t("Copy to clipboard failed"),
        }),
      )
      .finally();
  };

  return (
    <Dropdown>
      <MenuButton
        aria-label="File actions"
        aria-haspopup="true"
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: "plain", color: "neutral" } }}
      >
        {!cloudSyncLoading && <MoreVertIcon />}
        {cloudSyncLoading && <CircularProgress size="sm" />}
      </MenuButton>
      <Menu placement="bottom-end">
        {cloudFileRef && !touchScreen && (
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
        {(platform === "desktop" || platform === "web") && (
          <MenuItem onClick={handleCopyToClipboard}>
            <ListItemDecorator>
              <ContentCopyIcon />
            </ListItemDecorator>{" "}
            {t("Copy to clipboard")}
          </MenuItem>
        )}
        {platform === "web" && (
          <MenuItem aria-label="Download todo.txt" onClick={onDownloadClick}>
            <ListItemDecorator>
              <DownloadIcon />
            </ListItemDecorator>{" "}
            {t("Download")}
          </MenuItem>
        )}
        <MenuItem onClick={handleCloseFile} aria-label="Delete file">
          <ListItemDecorator>
            {deleteFile && <DeleteForeverIcon />}
            {!deleteFile && <CloseIcon />}
          </ListItemDecorator>{" "}
          {deleteFile ? t("Delete") : t("Close")}
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
