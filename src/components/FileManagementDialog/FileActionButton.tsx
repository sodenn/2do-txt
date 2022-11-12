import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  IconProps,
  ListItemIcon,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  useTheme,
} from "@mui/material";
import React, { ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CloudStorage,
  cloudStorageIcons,
  useCloudFileDialog,
  useCloudStorage,
} from "../../data/CloudStorageContext";
import { useFileCreateDialog } from "../../data/FileCreateDialogContext";
import { useFileManagementDialog } from "../../data/FileManagementDialogContext";
import { useTask } from "../../data/TaskContext";
import { getPlatform } from "../../utils/platform";

const FileActionButton = () => {
  const { t } = useTranslation();
  const platform = getPlatform();
  const { openTodoFilePicker } = useTask();
  const { setFileCreateDialog } = useFileCreateDialog();
  const { setFileManagementDialogOpen } = useFileManagementDialog();
  const { cloudStoragesConnectionStatus, cloudStorageEnabled } =
    useCloudStorage();
  const { setCloudFileDialogOptions } = useCloudFileDialog();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options: { label: string; icon: ReactNode; click: () => void }[] = [
    {
      label: t("Create todo.txt"),
      icon: <AddOutlinedIcon fontSize="small" />,
      click: () => {
        setFileCreateDialog({ open: true });
        setFileManagementDialogOpen(false);
      },
    },
    {
      label:
        platform === "electron" ? t("Open todo.txt") : t("Import todo.txt"),
      icon: <FolderOpenOutlinedIcon fontSize="small" />,
      click: () => {
        openTodoFilePicker();
        setFileManagementDialogOpen(false);
      },
    },
  ];

  Object.entries(cloudStoragesConnectionStatus)
    .filter(([, connected]) => cloudStorageEnabled && connected)
    .map(([cloudStorages]) => cloudStorages as CloudStorage)
    .forEach((cloudStorage) => {
      const icon = cloudStorageIcons[cloudStorage];
      options.push({
        label: t("Import from cloud storage", { cloudStorage }),
        icon: React.isValidElement<IconProps>(icon)
          ? React.cloneElement(icon, {
              fontSize: "small",
            })
          : icon,
        click: () => {
          setCloudFileDialogOptions({ open: true, cloudStorage });
          setFileManagementDialogOpen(false);
        },
      });
    });

  const handleClick = () => {
    options[selectedIndex].click();
  };

  const handleMenuItemClick = (event: any, index: number) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: any) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <ButtonGroup
        fullWidth
        variant="outlined"
        ref={anchorRef}
        aria-label="Split button"
      >
        <Button
          fullWidth
          onClick={handleClick}
          startIcon={options[selectedIndex].icon}
        >
          {options[selectedIndex].label}
        </Button>
        <Button
          sx={{ flex: 0 }}
          aria-controls={open ? "file-action-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="Select file action"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        role={undefined}
        transition
        style={{ zIndex: theme.zIndex.modal }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="file-action-menu">
                  {options.map((item, index) => (
                    <MenuItem
                      key={index}
                      selected={selectedIndex === index}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      {item.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default FileActionButton;
