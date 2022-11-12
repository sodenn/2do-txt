import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Button,
  ButtonGroup,
  ButtonProps,
  ClickAwayListener,
  Grow,
  IconProps,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import React, { useMemo } from "react";
import { WithChildren } from "../types/common.types";
import { generateId } from "../utils/uuid";

interface SplitButtonProps extends WithChildren {
  loading?: boolean;
  "aria-label"?: string | undefined;
}

interface SplitButtonItemProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  onClick: ButtonProps["onClick"];
}

export const SplitButtonItem = (props: SplitButtonItemProps) => {
  return <button {...props} />;
};

const SplitButton = (props: SplitButtonProps) => {
  const { loading, children } = props;
  const id = `${generateId()}-split-button-menu`;
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const options = useMemo(
    () =>
      React.Children.map(children, (child) => {
        if (!React.isValidElement(child) || child.type !== SplitButtonItem) {
          throw Error(
            `<SplitButton> should only contain <SplitButtonItem/> as children.`
          );
        }
        return child.props as SplitButtonItemProps;
      }) ?? [],
    [children]
  );

  const handleClick: ButtonProps["onClick"] = (event) => {
    const option = options[selectedIndex];
    if (option.onClick) {
      option.onClick(event);
    }
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  return (
    <React.Fragment>
      <ButtonGroup
        sx={{ width: "100%" }}
        disabled={loading}
        variant="outlined"
        ref={anchorRef}
        aria-label={props["aria-label"]}
      >
        <Button
          fullWidth
          disabled={loading}
          onClick={handleClick}
          startIcon={options[selectedIndex].icon}
        >
          {options[selectedIndex].label}
        </Button>
        <Button
          size="small"
          aria-controls={open ? id : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="Split Button"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper sx={{ my: 0.5 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id={id} autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={index}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option.icon &&
                        React.isValidElement<IconProps>(option.icon) && (
                          <ListItemIcon>
                            {React.cloneElement(option.icon, {
                              fontSize: "small",
                            })}
                          </ListItemIcon>
                        )}
                      <ListItemText>{option.label}</ListItemText>
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

export default SplitButton;
