import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import {
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface CloseFileItemMenuProps {
  filePath: string;
  onOpen: (filePath: string) => void;
  onDelete: (filePath: string) => void;
}

const CloseFileItemMenu = (props: CloseFileItemMenuProps) => {
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

export default CloseFileItemMenu;
