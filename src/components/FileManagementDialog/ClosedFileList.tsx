import StartEllipsis from "@/components/StartEllipsis";
import { readFile } from "@/native-api/filesystem";
import useFilterStore from "@/stores/filter-store";
import { addTodoFilePath } from "@/utils/settings";
import useTask from "@/utils/useTask";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ClosedFileListProps {
  list: string[];
  onOpen: () => void;
  onDelete: (filePath: string) => void;
}

interface FileProps {
  filePath: string;
  onOpen: (filePath: string) => void;
  onDelete: (filePath: string) => void;
}

export default function ClosedFileList(props: ClosedFileListProps) {
  const { list, onOpen, onDelete } = props;
  const { t } = useTranslation();
  const { loadTodoFile } = useTask();
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );

  const handleOpen = async (filePath: string) => {
    const data = await readFile(filePath);
    loadTodoFile(filePath, data).then(() => {
      setActiveTaskListPath(filePath);
      addTodoFilePath(filePath);
      onOpen();
    });
  };

  if (list.length === 0) {
    return null;
  }

  return (
    <List
      sx={{ py: 0 }}
      subheader={
        <ListSubheader sx={{ bgcolor: "inherit" }} component="div">
          {t("Closed files")}
        </ListSubheader>
      }
    >
      {list.map((filePath) => (
        <File
          key={filePath}
          filePath={filePath}
          onOpen={handleOpen}
          onDelete={onDelete}
        />
      ))}
    </List>
  );
}

function File(props: FileProps) {
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <FileMenu
          filePath={props.filePath}
          onOpen={props.onOpen}
          onDelete={props.onDelete}
        />
      }
    >
      <ListItemButton sx={{ pl: 3, overflow: "hidden" }} role={undefined}>
        <StartEllipsis variant="inherit">{props.filePath}</StartEllipsis>
      </ListItemButton>
    </ListItem>
  );
}

function FileMenu(props: FileProps) {
  const { filePath, onOpen, onDelete } = props;
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => {
    onOpen(filePath);
    handleClose();
  };

  const handleDelete = () => {
    onDelete(filePath);
    handleClose();
  };

  return (
    <>
      <IconButton aria-label="more" aria-haspopup="true" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <MenuItem onClick={handleOpen}>
          <ListItemIcon>
            <OpenInNewOutlinedIcon />
          </ListItemIcon>
          <Typography>{t("Open")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutlineOutlinedIcon />
          </ListItemIcon>
          <Typography>{t("Delete")}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
