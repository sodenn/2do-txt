import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import {
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Typography,
} from "@mui/material";
import { forwardRef, useEffect, useState } from "react";
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
  onClose: (options: CloseOptions) => void;
}

const OpenFileItem = forwardRef<HTMLLIElement, OpenFileItemProps>(
  (props: OpenFileItemProps, ref) => {
    const { filePath, onClose, ...rest } = props;
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
      <ListItem
        ref={ref}
        disablePadding
        secondaryAction={
          <OpenFileItemMenu
            filePath={filePath}
            cloudFileRef={cloudFileRef}
            onChange={setCloudFileRef}
            onClose={onClose}
          />
        }
        {...rest}
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
    );
  }
);

export default OpenFileItem;
