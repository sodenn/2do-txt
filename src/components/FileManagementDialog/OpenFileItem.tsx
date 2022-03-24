import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { useCloudStorage } from "../../data/CloudStorageContext";
import { useSettings } from "../../data/SettingsContext";
import { CloudFileRef } from "../../types/cloud-storage.types";
import { formatLocalDateTime, parseDate } from "../../utils/date";
import StartEllipsis from "../StartEllipsis";
import OpenFileItemMenu from "./OpenFileItemMenu";

export interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

interface OpenFileItemProps {
  filePath: string;
  index: number;
  onClose: (options: CloseOptions) => void;
}

const OpenFileItem = (props: OpenFileItemProps) => {
  const { filePath, index, onClose } = props;
  const { language } = useSettings();
  const { getCloudFileRefByFilePath } = useCloudStorage();
  const [cloudFileRef, setCloudFileRef] = useState<CloudFileRef>();
  const cloudFileLastModified = cloudFileRef
    ? parseDate(cloudFileRef.lastSync)
    : undefined;

  useEffect(() => {
    getCloudFileRefByFilePath(filePath).then(setCloudFileRef);
  }, [filePath, getCloudFileRefByFilePath]);

  return (
    <Draggable draggableId={filePath} index={index}>
      {(provided, snapshot) => (
        <ListItem
          disablePadding
          secondaryAction={
            <OpenFileItemMenu
              filePath={filePath}
              cloudFileRef={cloudFileRef}
              onChange={setCloudFileRef}
              onClose={onClose}
            />
          }
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            ...(snapshot.isDragging && { bgcolor: "action.hover" }),
            outline: "none",
          }}
        >
          <ListItemButton sx={{ pl: 3, overflow: "hidden" }} role={undefined}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <DragIndicatorIcon />
            </ListItemIcon>
            <Box sx={{ overflow: "hidden" }}>
              <StartEllipsis sx={{ pr: 2 }} variant="inherit">
                {filePath}
              </StartEllipsis>
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
      )}
    </Draggable>
  );
};

export default OpenFileItem;
