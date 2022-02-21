import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { CloudStorage } from "../types/cloud-storage.types";

interface CloudStorageFileManagerProps {
  onClick: () => void;
  cloudStorage: CloudStorage;
}

const CloudStorageFileButton = (props: CloudStorageFileManagerProps) => {
  const { onClick, cloudStorage } = props;
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const {
    setCloudStorageFileDialogOpen,
    cloudStorageEnabled,
    cloudStorageConnected,
    unlink,
  } = useCloudStorage();

  const options = [
    t(`Choose from ${cloudStorage}`),
    t(`Disconnect ${cloudStorage}`),
  ];

  const handleClick = () => {
    if (selectedIndex === 0) {
      setCloudStorageFileDialogOpen(true);
      onClick();
    } else if (selectedIndex === 1) {
      unlink();
    }
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
  };

  if (!cloudStorageConnected || !cloudStorageEnabled) {
    return null;
  }

  return (
    <React.Fragment>
      <ButtonGroup
        variant="outlined"
        ref={anchorRef}
        aria-label={options[selectedIndex]}
      >
        <Button fullWidth onClick={handleClick}>
          {options[selectedIndex]}
        </Button>
        <Button
          size="small"
          aria-controls={open ? "cloud-storage-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select option"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        style={{ margin: 0 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        placement="bottom-end"
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="cloud-storage-menu">
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};

export default CloudStorageFileButton;
