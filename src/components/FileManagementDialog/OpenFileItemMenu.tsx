import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  CloudFileRef,
  CloudFileUnauthorizedError,
  CloudStorage,
  cloudStorageIcons,
  useCloudStorage,
} from "../../data/CloudStorageContext";
import { useTask } from "../../data/TaskContext";
import { writeToClipboard } from "../../utils/clipboard";
import { getDoneFilePath, getFilesystem } from "../../utils/filesystem";
import { getPlatform } from "../../utils/platform";

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

interface OpenFileItemMenuProps {
  filePath: string;
  cloudFileRef?: CloudFileRef;
  onChange: (cloudFileRef?: CloudFileRef) => void;
  onClose: (options: CloseOptions) => void;
  onDownloadClick: () => void;
}

interface EnableCloudStorageItemProps {
  cloudStorage: CloudStorage;
  filePath: string;
  onClick: () => void;
  onChange: (cloudFileRef?: CloudFileRef) => void;
  onLoad: (loading: boolean) => void;
  cloudFileRef?: CloudFileRef;
}

interface SyncWithCloudStorageItemProps {
  cloudFileRef: CloudFileRef;
  onClick: () => void;
}

const SyncWithCloudStorageItem = (opt: SyncWithCloudStorageItemProps) => {
  const { onClick, cloudFileRef } = opt;
  const { t } = useTranslation();
  const { syncTodoFileWithCloudStorage } = useTask();

  const handleClick = () => {
    syncTodoFileWithCloudStorage(cloudFileRef.localFilePath);
    onClick();
  };

  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        {cloudStorageIcons[cloudFileRef.cloudStorage]}
      </ListItemIcon>
      <Typography>
        {t("Sync with cloud storage", {
          cloudStorage: cloudFileRef.cloudStorage,
        })}
      </Typography>
    </MenuItem>
  );
};

const EnableCloudStorageItem = (props: EnableCloudStorageItemProps) => {
  const { cloudStorage, filePath, cloudFileRef, onClick, onChange, onLoad } =
    props;
  const { t } = useTranslation();
  const {
    unlinkCloudFile,
    cloudStoragesConnectionStatus,
    cloudStorageEnabled,
    uploadFile,
  } = useCloudStorage();
  const { enqueueSnackbar } = useSnackbar();
  const { readFile, isFile } = getFilesystem();
  const [loading, setLoading] = useState(false);

  const enableCloudSync = async () => {
    onClick();
    try {
      setLoading(true);
      onLoad(true);

      if (!cloudFileRef) {
        const readFileResult = await readFile({
          path: filePath,
        });

        const uploadResult = await uploadFile({
          filePath,
          text: readFileResult.data,
          cloudStorage,
          isDoneFile: false,
        });

        const doneFilePath = getDoneFilePath(filePath);
        if (doneFilePath) {
          const doneFileExists = await isFile({
            path: doneFilePath,
          });
          if (doneFileExists) {
            const readDoneFileResult = await readFile({
              path: filePath,
            });
            await uploadFile({
              filePath,
              text: readDoneFileResult.data,
              cloudStorage,
              isDoneFile: true,
            }).catch((e) => void e);
          }
        }

        onChange(uploadResult);
      } else {
        await unlinkCloudFile(filePath);
        onChange(undefined);
      }
    } catch (e: any) {
      if (!(e instanceof CloudFileUnauthorizedError)) {
        console.debug(e);
        enqueueSnackbar(
          <Trans
            i18nKey="Error syncing file to cloud storage"
            values={{ cloudStorage, message: e.message }}
            components={{ code: <code style={{ marginLeft: 5 }} /> }}
          />,
          {
            variant: "warning",
          }
        );
      }
    } finally {
      setLoading(false);
      onLoad(false);
    }
  };

  if (
    !cloudStorageEnabled ||
    (!cloudStoragesConnectionStatus[cloudStorage] && !cloudFileRef)
  ) {
    return null;
  }

  const buttonText = cloudFileRef
    ? t("Disable cloud storage sync", {
        cloudStorage,
      })
    : t("Enable cloud storage sync", {
        cloudStorage,
      });

  return (
    <MenuItem onClick={enableCloudSync} disabled={loading}>
      <ListItemIcon>
        {loading && <CircularProgress size={24} />}
        {!loading && cloudStorageIcons[cloudStorage]}
      </ListItemIcon>
      <Typography>{buttonText}</Typography>
    </MenuItem>
  );
};

const OpenFileItemMenu = (props: OpenFileItemMenuProps) => {
  const { filePath, cloudFileRef, onChange, onClose, onDownloadClick } = props;
  const { connectedCloudStorages } = useCloudStorage();
  const { t } = useTranslation();
  const platform = getPlatform();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const { readFile } = getFilesystem();
  const open = Boolean(anchorEl);
  const cloudStorages = useMemo(() => {
    const value = [...connectedCloudStorages];
    if (cloudFileRef && !value.includes(cloudFileRef.cloudStorage)) {
      value.push(cloudFileRef.cloudStorage);
    }
    return value;
  }, [cloudFileRef, connectedCloudStorages]);

  const deleteFile =
    platform === "web" || platform === "ios" || platform === "android";

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseFile = () => {
    onClose({ filePath, deleteFile });
    handleClose();
  };

  const handleCopyToClipboard = () => {
    const promise = readFile({
      path: filePath,
    }).then((result) => result.data);
    writeToClipboard(promise)
      .then(() =>
        enqueueSnackbar(t("Copied to clipboard"), { variant: "info" })
      )
      .catch(() =>
        enqueueSnackbar(t("Copy to clipboard failed"), { variant: "error" })
      )
      .finally(handleClose);
  };

  return (
    <>
      <IconButton
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
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {cloudFileRef && (
          <SyncWithCloudStorageItem
            cloudFileRef={cloudFileRef}
            onClick={handleClose}
          />
        )}
        {cloudStorages.map((cloudStorage) => (
          <EnableCloudStorageItem
            key={cloudStorage}
            cloudStorage={cloudStorage}
            onClick={handleClose}
            onChange={onChange}
            filePath={filePath}
            onLoad={setCloudSyncLoading}
            cloudFileRef={
              cloudFileRef?.cloudStorage === cloudStorage
                ? cloudFileRef
                : undefined
            }
          />
        ))}
        {(platform === "electron" || platform === "web") && (
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

export default OpenFileItemMenu;
