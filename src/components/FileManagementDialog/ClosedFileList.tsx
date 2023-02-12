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
import { useFilter } from "../../data/FilterContext";
import { useSettings } from "../../data/SettingsContext";
import { useTask } from "../../data/TaskContext";
import { readFile } from "../../utils/filesystem";
import StartEllipsis from "../StartEllipsis";

interface ClosedFileListProps {
  list: string[];
  onOpen: () => void;
  onDelete: (filePath: string) => void;
}

interface ItemMenuProps {
  filePath: string;
  onOpen: (filePath: string) => void;
  onDelete: (filePath: string) => void;
}

const ClosedFileList = (props: ClosedFileListProps) => {
  const { list, onOpen, onDelete } = props;
  const { t } = useTranslation();
  const { loadTodoFile } = useTask();
  const { addTodoFilePath } = useSettings();
  const { setActiveTaskListPath } = useFilter();

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
      {list.map((filePath, idx) => (
        <ListItem
          key={idx}
          disablePadding
          secondaryAction={
            <ItemMenu
              filePath={filePath}
              onOpen={handleOpen}
              onDelete={onDelete}
            />
          }
        >
          <ListItemButton sx={{ pl: 3, overflow: "hidden" }} role={undefined}>
            <StartEllipsis variant="inherit">{filePath}</StartEllipsis>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

const ItemMenu = (props: ItemMenuProps) => {
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
};

export default ClosedFileList;
