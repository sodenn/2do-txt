import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListSubheader,
  Typography,
} from "@mui/material";
import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { arrayMove, List as MovableList } from "react-movable";
import { OnChangeMeta } from "react-movable/lib/types";
import { CloudFileRef, useCloudStorage } from "../../data/CloudStorageContext";
import { useSettings } from "../../data/SettingsContext";
import { useTask } from "../../data/TaskContext";
import { formatLocalDateTime, parseDate } from "../../utils/date";
import StartEllipsis from "../StartEllipsis";
import OpenFileItemMenu from "./OpenFileItemMenu";

interface OpenFileListProps {
  subheader: boolean;
  onClose: (options: CloseOptions) => void;
}

interface FileListItemProps {
  filePath: string;
  onClose: (options: CloseOptions) => void;
}

export interface CloseOptions {
  filePath: string;
  deleteFile: boolean;
}

const OpenFileList = memo((props: OpenFileListProps) => {
  const { subheader, onClose } = props;
  const wrapper = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const { taskLists, reorderTaskList } = useTask();
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
          <FileListItem filePath={value} onClose={onClose} {...props} />
        )}
        onChange={handleChange}
      />
    </div>
  );
});

const FileListItem = forwardRef<HTMLLIElement, FileListItemProps>(
  (props, ref) => {
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
        data-testid="draggable-file"
        aria-label={`Draggable file ${filePath}`}
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

export default OpenFileList;
