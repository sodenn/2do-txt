import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
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
import { writeToClipboard } from "../../utils/clipboard";
import { getDoneFilePath, isFile, readFile } from "../../utils/filesystem";
import { getPlatform } from "../../utils/platform";
import useTask from "../../utils/useTask";

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
    unlinkCloudDoneFile,
    cloudStoragesConnectionStatus,
    cloudStorageEnabled,
    uploadFile,
  } = useCloudStorage();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const enableCloudSync = async () => {
    onClick();
    try {
      setLoading(true);
      onLoad(true);

      if (!cloudFileRef) {
        const todoFileData = await readFile(filePath);

        const uploadResult = await uploadFile({
          filePath,
          text: todoFileData,
          cloudStorage,
          isDoneFile: false,
        });

        const doneFilePath = getDoneFilePath(filePath);
        if (doneFilePath) {
          const doneFileExists = await isFile(doneFilePath);
          if (doneFileExists) {
            const doneFileData = await readFile(filePath);
            await uploadFile({
              filePath,
              text: doneFileData,
              cloudStorage,
              isDoneFile: true,
            }).catch((e) => void e);
          }
        }

        onChange(uploadResult as CloudFileRef);
      } else {
        await Promise.all([
          unlinkCloudFile(filePath),
          unlinkCloudDoneFile(filePath),
        ]).catch((e) => void e);
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
        {!loading && !cloudFileRef && cloudStorageIcons[cloudStorage]}
        {!loading && cloudFileRef && <CloudOffRoundedIcon />}
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
    const promise = readFile(filePath);
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

export default OpenFileItemMenu;
