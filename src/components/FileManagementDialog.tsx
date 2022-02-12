import { Clipboard } from "@capacitor/clipboard";
import { Directory, Encoding } from "@capacitor/filesystem";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  Dialog,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListSubheader,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { memo, MouseEvent, useCallback, useEffect, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { Trans, useTranslation } from "react-i18next";
import { useConfirmationDialog } from "../data/ConfirmationDialogContext";
import { useFileManagementDialog } from "../data/FileManagementContext";
import { useFilter } from "../data/FilterContext";
import { useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";
import { getFilenameFromPath, useFilesystem } from "../utils/filesystem";
import { usePlatform } from "../utils/platform";
import StartEllipsis from "./StartEllipsis";

interface CloseOptions {
  event: MouseEvent<HTMLButtonElement>;
  filePath: string;
  deleteFile: boolean;
}

export type DraggableListProps = {
  subheader: boolean;
  onClick: (filePath: string) => void;
  onClose: (options: CloseOptions) => void;
};

export type DraggableListItemProps = {
  filePath: string;
  index: number;
  onClick: (filePath: string) => void;
  onClose: (options: CloseOptions) => void;
};

const TaskListItem = (props: DraggableListItemProps) => {
  const { filePath, index, onClick, onClose } = props;
  const { t } = useTranslation();
  const platform = usePlatform();

  return (
    <Draggable draggableId={filePath} index={index}>
      {(provided, snapshot) => (
        <ListItem
          button
          onClick={() => onClick(filePath)}
          secondaryAction={
            platform === "web" ||
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
            )
          }
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            ...(snapshot.isDragging && { bgcolor: "action.hover" }),
          }}
        >
          <ListItemIcon>
            <DragIndicatorIcon />
          </ListItemIcon>
          <StartEllipsis sx={{ my: 0.5 }} variant="inherit" noWrap>
            {filePath}
          </StartEllipsis>
        </ListItem>
      )}
    </Draggable>
  );
};

const TaskList = memo((props: DraggableListProps) => {
  const { subheader, onClick, onClose } = props;
  const { taskLists, reorderTaskList } = useTask();
  const { t } = useTranslation();

  if (taskLists.length === 0) {
    return null;
  }

  const handleDragEnd = ({ destination, source }: DropResult) => {
    if (destination) {
      const startIndex = source.index;
      const endIndex = destination.index;
      const filePaths = taskLists.map((t) => t.filePath);
      const [removed] = filePaths.splice(startIndex, 1);
      filePaths.splice(endIndex, 0, removed);
      reorderTaskList(filePaths);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="droppable-list">
        {(provided) => (
          <List
            sx={{ pt: 0 }}
            subheader={
              subheader ? (
                <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
                  {t("Open files")}
                </ListSubheader>
              ) : undefined
            }
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {taskLists.map((item, index) => (
              <TaskListItem
                filePath={item.filePath}
                index={index}
                key={item.filePath}
                onClick={onClick}
                onClose={onClose}
              />
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
});

const FileManagementDialog = () => {
  const platform = usePlatform();
  const { open, setFileManagementDialog } = useFileManagementDialog();
  const { setConfirmationDialog } = useConfirmationDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { readdir, deleteFile, readFile } = useFilesystem();
  const { t } = useTranslation();
  const { taskLists, loadTodoFile, closeTodoFile } = useTask();
  const { addTodoFilePath } = useSettings();
  const { setActiveTaskListPath } = useFilter();
  const [files, setFiles] = useState<string[]>([]);
  const closedFiles = files.filter((f) =>
    taskLists.every((t) => t.filePath !== f)
  );

  const listFiles = useCallback(() => {
    if (platform !== "electron") {
      readdir({
        path: "",
        directory: Directory.Documents,
      }).then((result) => setFiles(result.files));
    }
  }, [platform, readdir]);

  useEffect(listFiles, [listFiles, platform]);

  const openDeleteConfirmationDialog = (
    filePath: string,
    handler: () => void
  ) => {
    setConfirmationDialog({
      title: t("Delete"),
      content: (
        <Trans
          i18nKey="Delete file"
          values={{ fileName: getFilenameFromPath(filePath) }}
        />
      ),
      buttons: [
        { text: t("Cancel") },
        {
          text: t("Delete"),
          handler,
        },
      ],
    });
  };

  const handleCloseFile = (options: CloseOptions) => {
    const { event, filePath, deleteFile } = options;
    event.stopPropagation();
    if (deleteFile) {
      openDeleteConfirmationDialog(filePath, () => {
        if (taskLists.length === 1) {
          handleClose();
        }
        closeTodoFile(filePath).then(listFiles);
      });
    } else {
      if (taskLists.length === 1) {
        handleClose();
      }
      closeTodoFile(filePath).then(listFiles);
    }
  };

  const handleDeleteFile = (
    event: MouseEvent<HTMLButtonElement>,
    filePath: string
  ) => {
    event.stopPropagation();
    openDeleteConfirmationDialog(filePath, () => {
      deleteFile({
        path: filePath,
        directory: Directory.Documents,
      })
        .catch((error) => {
          console.debug(error);
        })
        .then(listFiles);
    });
  };

  const handleOpenFile = async (
    event: MouseEvent<HTMLButtonElement>,
    filePath: string
  ) => {
    event.stopPropagation();
    const result = await readFile({
      path: filePath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    loadTodoFile(filePath, result.data).then(() => {
      setActiveTaskListPath(filePath);
      addTodoFilePath(filePath);
      handleClose();
    });
  };

  const handleCopyToClipboard = async (filePath: string) => {
    const result = await readFile({
      path: filePath,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    await Clipboard.write({
      string: result.data,
    });
    enqueueSnackbar(t("Copied to clipboard"), { variant: "info" });
  };

  const handleClose = () => {
    setFileManagementDialog({ open: false });
  };

  return (
    <Dialog maxWidth="xs" open={open} onClose={handleClose}>
      <DialogTitle sx={{ px: 2 }}>{t("Manage todo.txt")}</DialogTitle>
      <TaskList
        subheader={closedFiles.length > 0}
        onClick={handleCopyToClipboard}
        onClose={handleCloseFile}
      />
      {closedFiles.length > 0 && (
        <List
          sx={{ pt: 0 }}
          subheader={
            <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
              {t("Closed files")}
            </ListSubheader>
          }
        >
          {closedFiles.map((file, idx) => (
            <ListItem
              key={idx}
              button
              sx={{ pr: 12 }}
              onClick={() => handleCopyToClipboard(file)}
              secondaryAction={
                <>
                  <Tooltip title={t("Open") as string}>
                    <IconButton
                      aria-label="Open file"
                      onClick={(event) => handleOpenFile(event, file)}
                    >
                      <OpenInNewOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("Delete") as string}>
                    <IconButton
                      edge="end"
                      aria-label="Delete file"
                      onClick={(event) => handleDeleteFile(event, file)}
                    >
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </>
              }
            >
              <StartEllipsis sx={{ my: 0.5 }} variant="inherit" noWrap>
                {file}
              </StartEllipsis>
            </ListItem>
          ))}
        </List>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ p: 2 }}>
        {t("Click on the list items to copy the file content to the clipboard")}
      </Typography>
    </Dialog>
  );
};

export default FileManagementDialog;
