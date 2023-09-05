import { StartEllipsis } from "@/components/StartEllipsis";
import { writeToClipboard } from "@/native-api/clipboard";
import { fileExists, readFile } from "@/native-api/filesystem";
import { hasTouchScreen } from "@/native-api/platform";
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
import { TaskList } from "@/utils/task-list";
import { getDoneFilePath } from "@/utils/todo-files";
import { useTask } from "@/utils/useTask";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import {
  Box,
  CircularProgress,
  Dropdown,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemDecorator,
  ListSubheader,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import { useSnackbar } from "notistack";
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { List as MovableList, arrayMove } from "react-movable";
import { OnChangeMeta } from "react-movable/lib/types";

type CloudFileRefWithIdentifier = CloudFileRef & WithIdentifier;

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

interface OpenFileListProps {
  subheader: boolean;
  onClose: (options: CloseOptions) => void;
}

interface FileProps {
  filePath: string;
  taskList: TaskList;
  onDownload: (taskList: TaskList) => void;
  onClose: (options: CloseOptions) => void;
}

interface FileMenuProps {
  filePath: string;
  cloudFileRef?: CloudFileRefWithIdentifier;
  onChange: (cloudFileRef?: CloudFileRefWithIdentifier) => void;
  onClose: (options: CloseOptions) => void;
  onDownloadClick: () => void;
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

export const OpenFileList = memo((props: OpenFileListProps) => {
  const { subheader, onClose } = props;
  const container = useRef<HTMLDivElement>(null);
  const { taskLists, reorderTaskList, downloadTodoFile } = useTask();
  const [items, setItems] = useState(taskLists.map((t) => t.filePath));
  const { t } = useTranslation();

  // update list items when a file was deleted
  useEffect(() => {
    setItems(taskLists.map((t) => t.filePath));
  }, [taskLists]);

  const handleChange = ({ oldIndex, newIndex }: OnChangeMeta) => {
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    reorderTaskList(newItems);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={container}>
      <MovableList
        lockVertically
        values={items}
        container={container.current}
        renderList={({ children, props }) => (
          <List variant="outlined" sx={{ borderRadius: "sm" }} {...props}>
            <ListItem nested>
              {subheader && (
                <ListSubheader sticky>{t("Open files")}</ListSubheader>
              )}
              <List>{children}</List>
            </ListItem>
          </List>
        )}
        renderItem={({ value, props }) => (
          <File
            taskList={taskLists.find((t) => t.filePath === value)!}
            filePath={value}
            onClose={onClose}
            onDownload={() =>
              downloadTodoFile(taskLists.find((t) => t.filePath === value))
            }
            {...props}
          />
        )}
        onChange={handleChange}
      />
    </div>
  );
});

const File = forwardRef<HTMLLIElement, FileProps>((props, ref) => {
  const { filePath, taskList, onClose, onDownload, ...rest } = props;
  const language = useSettingsStore((state) => state.language);
  const { getCloudFileRef } = useCloudStorage();
  const [cloudFileRef, setCloudFileRef] =
    useState<CloudFileRefWithIdentifier>();
  const cloudFileLastModified = cloudFileRef
    ? parseDate(cloudFileRef.lastSync)
    : undefined;

  useEffect(() => {
    getCloudFileRef(filePath).then(setCloudFileRef);
  }, [filePath, getCloudFileRef]);

  return (
    <ListItem
      ref={ref}
      endAction={
        <FileMenu
          filePath={filePath}
          cloudFileRef={cloudFileRef}
          onChange={setCloudFileRef}
          onClose={onClose}
          onDownloadClick={() => onDownload(taskList)}
        />
      }
      {...rest}
      data-testid="draggable-file"
      aria-label={`Draggable file ${filePath}`}
    >
      <ListItemButton sx={{ pl: 2, overflow: "hidden" }} role={undefined}>
        <ListItemDecorator>
          <DragIndicatorIcon />
        </ListItemDecorator>
        <Box sx={{ overflow: "hidden" }}>
          <StartEllipsis variant="inherit">{filePath}</StartEllipsis>
          {cloudFileRef && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                color: "text.secondary",
                mt: 0.5,
                gap: 0.5,
              }}
            >
              <SyncOutlinedIcon color="inherit" fontSize="inherit" />
              <Typography level="body-sm">
                {cloudFileLastModified &&
                  formatLocalDateTime(cloudFileLastModified, language)}
              </Typography>
            </Box>
          )}
        </Box>
      </ListItemButton>
    </ListItem>
  );
});

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
  const { enqueueSnackbar } = useSnackbar();
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
        enqueueSnackbar(
          <span>
            <Trans
              i18nKey="Error syncing file to cloud storage"
              values={{ provider, message: e.message }}
              components={{ code: <code style={{ marginLeft: 5 }} /> }}
            />
          </span>,
          {
            variant: "warning",
          },
        );
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
  const { filePath, cloudFileRef, onChange, onClose, onDownloadClick } = props;
  const { cloudStorages } = useCloudStorage();
  const touchScreen = hasTouchScreen();
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { enqueueSnackbar } = useSnackbar();
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const providers = useMemo(() => {
    const value = [...cloudStorages.map((s) => s.provider)];
    if (cloudFileRef && !value.includes(cloudFileRef.provider)) {
      value.push(cloudFileRef.provider);
    }
    return value;
  }, [cloudFileRef, cloudStorages]);

  const deleteFile =
    platform === "web" || platform === "ios" || platform === "android";

  const handleCloseFile = () => {
    onClose({ filePath, deleteFile });
  };

  const handleCopyToClipboard = () => {
    const promise = readFile(filePath);
    writeToClipboard(promise)
      .then(() =>
        enqueueSnackbar(t("Copied to clipboard"), { variant: "info" }),
      )
      .catch(() =>
        enqueueSnackbar(t("Copy to clipboard failed"), { variant: "error" }),
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
            {deleteFile && <DeleteOutlineOutlinedIcon />}
            {!deleteFile && <CloseOutlinedIcon />}
          </ListItemDecorator>{" "}
          {deleteFile ? t("Delete") : t("Close")}
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
