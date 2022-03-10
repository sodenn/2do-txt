import { Clipboard } from "@capacitor/clipboard";
import { Directory, Encoding } from "@capacitor/filesystem";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  CircularProgress,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  cloudStorageIcons,
  useCloudStorage,
} from "../../data/CloudStorageContext";
import { useTask } from "../../data/TaskContext";
import {
  CloudFileRef,
  CloudFileUnauthorizedError,
  CloudStorage,
} from "../../types/cloud-storage.types";
import { useFilesystem } from "../../utils/filesystem";
import { usePlatform } from "../../utils/platform";

interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

interface OpenFileItemMenuProps {
  filePath: string;
  cloudFileRef?: CloudFileRef;
  onChange: (cloudFileRef?: CloudFileRef) => void;
  onClose: (options: CloseOptions) => void;
}

interface CloudStorageMenuItemProps {
  cloudStorage: CloudStorage;
  filePath: string;
  onClick: () => void;
  onChange: (cloudFileRef?: CloudFileRef) => void;
  onLoad: (loading: boolean) => void;
  cloudFileRef?: CloudFileRef;
}

const CloudStorageMenuItem = (props: CloudStorageMenuItemProps) => {
  const { cloudStorage, filePath, cloudFileRef, onClick, onChange, onLoad } =
    props;
  const { t } = useTranslation();
  const {
    unlinkFile,
    uploadFileAndResolveConflict,
    connectedCloudStorages,
    cloudStorageEnabled,
  } = useCloudStorage();
  const { saveTodoFile } = useTask();
  const { enqueueSnackbar } = useSnackbar();
  const { readFile } = useFilesystem();
  const [loading, setLoading] = useState(false);

  const handleCloudSync = async () => {
    onClick();
    try {
      setLoading(true);
      onLoad(true);
      if (!cloudFileRef) {
        const readFileResult = await readFile({
          path: filePath,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        const result = await uploadFileAndResolveConflict({
          filePath,
          text: readFileResult.data,
          mode: "create",
          cloudStorage,
        });

        if (result && result.type === "no-conflict") {
          onChange(result.cloudFile);
        } else if (result && result.type === "conflict" && result.conflict) {
          if (result.conflict.option === "cloud") {
            const text = result.conflict.text;
            await saveTodoFile(filePath, text);
          }
          onChange(result.conflict.cloudFile);
        }
      } else {
        await unlinkFile(filePath);
        onChange(undefined);
      }
    } catch (e) {
      if (!(e instanceof CloudFileUnauthorizedError)) {
        console.debug(e);
        enqueueSnackbar(
          t(`Error syncing file to cloud storage`, { cloudStorage }),
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
    !connectedCloudStorages[cloudStorage] ||
    (cloudFileRef && cloudStorage !== cloudFileRef.cloudStorage)
  ) {
    return null;
  }

  return (
    <MenuItem onClick={handleCloudSync}>
      <ListItemIcon>
        {loading && <CircularProgress size={24} />}
        {!loading && cloudStorageIcons[cloudStorage]}
      </ListItemIcon>
      {cloudFileRef && (
        <Typography>
          {t("Disable cloud storage sync", {
            cloudStorage,
          })}
        </Typography>
      )}
      {!cloudFileRef && (
        <Typography>
          {t("Enable cloud storage sync", {
            cloudStorage,
          })}
        </Typography>
      )}
    </MenuItem>
  );
};

const OpenFileItemMenu = (props: OpenFileItemMenuProps) => {
  const { filePath, cloudFileRef, onChange, onClose } = props;
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const platform = usePlatform();
  const { enqueueSnackbar } = useSnackbar();
  const { readFile } = useFilesystem();
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);

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

  const handleCopyToClipboard = async () => {
    const result = await readFile({
      path: filePath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    await Clipboard.write({
      string: result.data,
    });
    enqueueSnackbar(t("Copied to clipboard"), { variant: "info" });
    handleClose();
  };

  const deleteFile =
    platform === "web" || platform === "ios" || platform === "android";

  return (
    <>
      <IconButton aria-label="more" aria-haspopup="true" onClick={handleClick}>
        {!cloudSyncLoading && <MoreVertIcon />}
        {cloudSyncLoading && <CircularProgress size={24} />}
      </IconButton>
      <Menu
        keepMounted
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <CloudStorageMenuItem
          cloudStorage="Dropbox"
          onClick={handleClose}
          onChange={onChange}
          filePath={filePath}
          onLoad={setCloudSyncLoading}
          cloudFileRef={cloudFileRef}
        />
        <MenuItem onClick={handleCopyToClipboard}>
          <ListItemIcon>
            <ContentCopyIcon />
          </ListItemIcon>
          <Typography>{t("Copy to clipboard")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleCloseFile}>
          <ListItemIcon>
            {deleteFile && <DeleteOutlineOutlinedIcon />}
            {!deleteFile && <CloseOutlinedIcon />}
          </ListItemIcon>
          <Typography>{deleteFile ? t("Delete") : t("Close")}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default OpenFileItemMenu;
