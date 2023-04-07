import { CloudFileRef, CloudStorageError, Provider } from "@cloudstorage/core";
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
import { writeToClipboard } from "../../native-api/clipboard";
import { isFile, readFile } from "../../native-api/filesystem";
import usePlatformStore from "../../stores/platform-store";
import { cloudStorageIcons, useCloudStorage } from "../../utils/CloudStorage";
import { getDoneFilePath } from "../../utils/todo-files";

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
  provider: Provider;
  filePath: string;
  onClick: () => void;
  onChange: (cloudFileRef?: CloudFileRef) => void;
  onLoad: (loading: boolean) => void;
  cloudFileRef?: CloudFileRef;
}

interface SyncWithCloudStorageItemProps {
  path: string;
  provider: Provider;
  onClick: () => void;
}

const SyncWithCloudStorageItem = (opt: SyncWithCloudStorageItemProps) => {
  const { onClick, path, provider } = opt;
  const { t } = useTranslation();
  const { syncTodoFile } = useCloudStorage();

  const handleClick = () => {
    syncTodoFile(path);
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

const EnableCloudStorageItem = (props: EnableCloudStorageItemProps) => {
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
        const ref = await uploadFile(filePath, todoFileData, provider);
        const doneFilePath = getDoneFilePath(filePath);
        if (doneFilePath) {
          const doneFileExists = await isFile(doneFilePath);
          if (doneFileExists) {
            const doneFileData = await readFile(doneFilePath);
            await uploadFile(doneFilePath, doneFileData, provider).catch(
              (e) => void e
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
          <Trans
            i18nKey="Error syncing file to cloud storage"
            values={{ provider, message: e.message }}
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
    (!cloudStorages.every((s) => s.provider !== provider) && !cloudFileRef)
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

const OpenFileItemMenu = (props: OpenFileItemMenuProps) => {
  const { filePath, cloudFileRef, onChange, onClose, onDownloadClick } = props;
  const { cloudStorages } = useCloudStorage();
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
            path={cloudFileRef.path}
            provider={cloudFileRef.provider}
            onClick={handleClose}
          />
        )}
        {providers.map((provider) => (
          <EnableCloudStorageItem
            key={provider}
            provider={provider}
            onClick={handleClose}
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

export default OpenFileItemMenu;
