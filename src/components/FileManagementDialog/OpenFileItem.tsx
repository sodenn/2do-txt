import { Directory, Encoding } from "@capacitor/filesystem";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  CircularProgress,
  IconButton,
  ListItem,
  ListItemIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { MouseEvent, useEffect, useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../../data/CloudStorageContext";
import { useSettings } from "../../data/SettingsContext";
import { CloudFile } from "../../types/cloud-storage.types";
import { formatLocalDateTime, parseDate } from "../../utils/date";
import { useFilesystem } from "../../utils/filesystem";
import { usePlatform } from "../../utils/platform";
import StartEllipsis from "../StartEllipsis";

export interface CloseOptions {
  event: MouseEvent<HTMLButtonElement>;
  filePath: string;
  deleteFile: boolean;
}

interface OpenFileItemProps {
  filePath: string;
  index: number;
  onClick: (filePath: string) => void;
  onClose: (options: CloseOptions) => void;
}

const OpenFileItem = (props: OpenFileItemProps) => {
  const { filePath, index, onClick, onClose } = props;
  const { t } = useTranslation();
  const { language } = useSettings();
  const platform = usePlatform();
  const { readFile } = useFilesystem();
  const {
    getCloudFileByFilePath,
    unlinkFile,
    cloudStorage,
    cloudStorageConnected,
    uploadFileAndResolveConflict,
  } = useCloudStorage();
  const [cloudFile, setCloudFile] = useState<CloudFile>();
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const cloudFileLastModified = cloudFile
    ? parseDate(cloudFile.modifiedAt)
    : undefined;

  useEffect(() => {
    getCloudFileByFilePath(filePath).then(setCloudFile);
  }, [filePath, getCloudFileByFilePath]);

  const handleCloudSync = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setCloudSyncLoading(true);

    if (!cloudFile) {
      const readFileResult = await readFile({
        path: filePath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const cloudFile = await uploadFileAndResolveConflict({
        filePath,
        text: readFileResult.data,
        mode: "create",
      });

      if (cloudFile) {
        setCloudFile(cloudFile);
      }
    } else {
      await unlinkFile(filePath);
      setCloudFile(undefined);
    }

    setCloudSyncLoading(false);
  };

  return (
    <Draggable draggableId={filePath} index={index}>
      {(provided, snapshot) => (
        <ListItem
          button
          onClick={() => onClick(filePath)}
          secondaryAction={
            <>
              {cloudStorageConnected && (
                <Tooltip
                  title={
                    !!cloudFile
                      ? (t("Cloud Storage synchronization enabled", {
                          cloudStorage,
                        }) as string)
                      : (t("Cloud Storage synchronization disabled", {
                          cloudStorage,
                        }) as string)
                  }
                >
                  <IconButton
                    aria-label="Delete file"
                    onClick={handleCloudSync}
                  >
                    {cloudSyncLoading && <CircularProgress size={24} />}
                    {!cloudSyncLoading && !!cloudFile && <CloudOutlinedIcon />}
                    {!cloudSyncLoading && !cloudFile && (
                      <CloudOffOutlinedIcon />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              {platform === "web" ||
              platform === "ios" ||
              platform === "android" ? (
                <Tooltip title={t("Delete") as string}>
                  <IconButton
                    edge="end"
                    aria-label="Delete file"
                    onClick={(event) =>
                      onClose({ event, filePath, deleteFile: true })
                    }
                  >
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title={t("Close") as string}>
                  <IconButton
                    edge="end"
                    aria-label="Close file"
                    onClick={(event) =>
                      onClose({ event, filePath, deleteFile: false })
                    }
                  >
                    <CloseOutlinedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          }
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            pr: cloudStorageConnected ? 12 : undefined,
            ...(snapshot.isDragging && { bgcolor: "action.hover" }),
          }}
        >
          <ListItemIcon sx={{ minWidth: 34 }}>
            <DragIndicatorIcon />
          </ListItemIcon>
          <Box sx={{ overflow: "hidden" }}>
            <StartEllipsis sx={{ my: 0.5 }} variant="inherit">
              {filePath}
            </StartEllipsis>
            {cloudFile && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "text.secondary",
                  gap: 0.5,
                }}
              >
                <EditIcon color="inherit" fontSize="inherit" />
                <Typography variant="body2">
                  {cloudFileLastModified &&
                    formatLocalDateTime(cloudFileLastModified, language)}
                </Typography>
              </Box>
            )}
          </Box>
        </ListItem>
      )}
    </Draggable>
  );
};

export default OpenFileItem;
