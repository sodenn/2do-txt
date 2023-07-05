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
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { List as MovableList, arrayMove } from "react-movable";
import { OnChangeMeta } from "react-movable/lib/types";
import { writeToClipboard } from "../../native-api/clipboard";
import { fileExists, readFile } from "../../native-api/filesystem";
import { hasTouchScreen } from "../../native-api/platform";
import usePlatformStore from "../../stores/platform-store";
import useSettingsStore from "../../stores/settings-store";
import {
  CloudFileRef,
  CloudStorageError,
  Provider,
  WithIdentifier,
  cloudStorageIcons,
  useCloudStorage,
} from "../../utils/CloudStorage";
import { formatLocalDateTime, parseDate } from "../../utils/date";
import { TaskList } from "../../utils/task-list";
import { getDoneFilePath } from "../../utils/todo-files";
import useTask from "../../utils/useTask";
import StartEllipsis from "../StartEllipsis";

type CloudFileRefWithIdentifier = CloudFileRef & WithIdentifier;

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

interface OpenFileListProps {
  subheader: boolean;
  onClose: (options: CloseOptions) => void;
}

interface FileListItemProps {
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
  onClick: () => void;
  onChange: (cloudFileRef: CloudFileRefWithIdentifier) => void;
}

interface EnableCloudSyncMenuItemProps {
  provider: Provider;
  filePath: string;
  onClick: () => void;
  onChange: (cloudFileRef?: CloudFileRefWithIdentifier) => void;
  onLoad: (loading: boolean) => void;
  cloudFileRef?: CloudFileRefWithIdentifier;
}

const OpenFileList = memo((props: OpenFileListProps) => {
  const { subheader, onClose } = props;
  const wrapper = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const { taskLists, reorderTaskList, downloadTodoFile } = useTask();
  const [items, setItems] = useState(taskLists.map((t) => t.filePath));
  const { t } = useTranslation();

  useEffect(() => {
    setContainer(wrapper.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapper.current]);

  useEffect(() => {
    setItems(taskLists.map((t) => t.filePath));
  }, [taskLists]);

  if (items.length === 0) {
    return null;
  }

  const handleChange = ({ oldIndex, newIndex }: OnChangeMeta) => {
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    reorderTaskList(newItems);
  };

  return (
    <div ref={wrapper}>
      <MovableList
        lockVertically
        values={items}
        container={container}
        renderList={({ children, props }) => (
          <List
            sx={{ py: 0 }}
            subheader={
              subheader ? (
                <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
                  {t("Open files")}
                </ListSubheader>
              ) : undefined
            }
            {...props}
          >
            {children}
          </List>
        )}
        renderItem={({ value, props }) => (
          <FileListItem
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

const FileListItem = forwardRef<HTMLLIElement, FileListItemProps>(
  (props, ref) => {
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
        disablePadding
        secondaryAction={
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
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DragIndicatorIcon />
          </ListItemIcon>
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
                <Typography variant="body2">
                  {cloudFileLastModified &&
                    formatLocalDateTime(cloudFileLastModified, language)}
                </Typography>
              </Box>
            )}
          </Box>
        </ListItemButton>
      </ListItem>
    );
  },
);

const CloudSyncMenuItem = (opt: CloudSyncMenuItemProps) => {
  const { onClick, onChange, identifier, provider } = opt;
  const { t } = useTranslation();
  const { syncFile, getCloudFileRef } = useCloudStorage();
  const { loadTodoFile } = useTask();

  const handleClick = async () => {
    const content = await syncFile(identifier);
    if (content) {
      loadTodoFile(identifier, content);
    }
    getCloudFileRef(identifier).then(onChange);
    onClick();
  };

  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>{cloudStorageIcons[provider]}</ListItemIcon>
      <Typography>
        {t("Sync with cloud storage", {
          provider: provider,
        })}
      </Typography>
    </MenuItem>
  );
};

const EnableCloudSyncMenuItem = (props: EnableCloudSyncMenuItemProps) => {
  const { provider, filePath, cloudFileRef, onClick, onChange, onLoad } = props;
  const { t } = useTranslation();
  const { cloudStorages, cloudStorageEnabled, uploadFile, unlinkCloudFile } =
    useCloudStorage();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const enableCloudSync = async () => {
    onClick();
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
      <ListItemIcon>
        {loading && <CircularProgress size={24} />}
        {!loading && !cloudFileRef && cloudStorageIcons[provider]}
        {!loading && cloudFileRef && <CloudOffRoundedIcon />}
      </ListItemIcon>
      <Typography>{buttonText}</Typography>
    </MenuItem>
  );
};

const FileMenu = (props: FileMenuProps) => {
  const { filePath, cloudFileRef, onChange, onClose, onDownloadClick } = props;
  const { cloudStorages } = useCloudStorage();
  const touchScreen = hasTouchScreen();
  const { t } = useTranslation();
  const platform = usePlatformStore((state) => state.platform);
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const open = Boolean(anchorEl);
  const providers = useMemo(() => {
    const value = [...cloudStorages.map((s) => s.provider)];
    if (cloudFileRef && !value.includes(cloudFileRef.provider)) {
      value.push(cloudFileRef.provider);
    }
    return value;
  }, [cloudFileRef, cloudStorages]);

  const deleteFile =
    platform === "web" || platform === "ios" || platform === "android";

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleCloseFile = () => {
    onClose({ filePath, deleteFile });
    handleCloseMenu();
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
      .finally(handleCloseMenu);
  };

  return (
    <>
      <IconButton
        edge="end"
        aria-label="File actions"
        aria-haspopup="true"
        onClick={handleClick}
      >
        {!cloudSyncLoading && <MoreVertIcon />}
        {cloudSyncLoading && <CircularProgress size={24} />}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {cloudFileRef && !touchScreen && (
          <CloudSyncMenuItem
            identifier={cloudFileRef.identifier}
            provider={cloudFileRef.provider}
            onClick={handleCloseMenu}
            onChange={onChange}
          />
        )}
        {providers.map((provider) => (
          <EnableCloudSyncMenuItem
            key={provider}
            provider={provider}
            onClick={handleCloseMenu}
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
            <ListItemIcon>
              <ContentCopyIcon />
            </ListItemIcon>
            <Typography>{t("Copy to clipboard")}</Typography>
          </MenuItem>
        )}
        {platform === "web" && (
          <MenuItem aria-label="Download todo.txt" onClick={onDownloadClick}>
            <ListItemIcon>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText>{t("Download")}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleCloseFile} aria-label="Delete file">
          <ListItemIcon>
            {deleteFile && <DeleteOutlineOutlinedIcon />}
            {!deleteFile && <CloseOutlinedIcon />}
          </ListItemIcon>
          <ListItemText>{deleteFile ? t("Delete") : t("Close")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default OpenFileList;
