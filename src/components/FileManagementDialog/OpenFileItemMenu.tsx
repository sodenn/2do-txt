import { Clipboard } from "@capacitor/clipboard";
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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudFileRef,
  CloudFileUnauthorizedError,
  CloudStorage,
  cloudStorageIcons,
  useCloudStorage,
} from "../../data/CloudStorageContext";
import { getArchiveFilePath, getFilesystem } from "../../utils/filesystem";
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
    unlinkCloudFile,
    cloudStoragesConnectionStatus,
    cloudStorageEnabled,
    uploadFile,
  } = useCloudStorage();
  const { enqueueSnackbar } = useSnackbar();
  const { readFile, isFile } = getFilesystem();
  const [loading, setLoading] = useState(false);

  const handleCloudSync = async () => {
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
          archive: false,
        });

        const archiveFilePath = getArchiveFilePath(filePath);
        if (archiveFilePath) {
          const localArchiveFileExists = await isFile({
            path: archiveFilePath,
          });
          if (localArchiveFileExists) {
            const readArchiveFileResult = await readFile({
              path: filePath,
            });
            await uploadFile({
              filePath,
              text: readArchiveFileResult.data,
              cloudStorage,
              archive: true,
            }).catch((e) => void e);
          }
        }

        onChange(uploadResult);
      } else {
        await unlinkCloudFile(filePath);
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
    !cloudStoragesConnectionStatus[cloudStorage] ||
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
  const { connectedCloudStorages } = useCloudStorage();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const platform = getPlatform();
  const { enqueueSnackbar } = useSnackbar();
  const { readFile } = getFilesystem();
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
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

  const handleCopyToClipboard = async () => {
    const { data } = await readFile({
      path: filePath,
    });
    await Clipboard.write({
      string: data,
    });
    enqueueSnackbar(t("Copied to clipboard"), { variant: "info" });
    handleClose();
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
        {connectedCloudStorages.map((cloudStorage) => (
          <CloudStorageMenuItem
            key={cloudStorage}
            cloudStorage={cloudStorage}
            onClick={handleClose}
            onChange={onChange}
            filePath={filePath}
            onLoad={setCloudSyncLoading}
            cloudFileRef={cloudFileRef}
          />
        ))}
        <MenuItem onClick={handleCopyToClipboard}>
          <ListItemIcon>
            <ContentCopyIcon />
          </ListItemIcon>
          <Typography>{t("Copy to clipboard")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleCloseFile} aria-label="Delete file">
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
