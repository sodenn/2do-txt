import CloseIcon from "@mui/icons-material/Close";
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { WithChildren } from "../../types/common.types";

interface FullScreenDialogTitleProps extends WithChildren {
  divider?: boolean;
  onClose: () => void;
  accept: {
    text?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  };
}

export const StyledAppBar = styled(AppBar)({
  paddingTop: "env(safe-area-inset-top)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

const FullScreenDialogTitle = (props: FullScreenDialogTitleProps) => {
  const { divider, onClose, accept, children } = props;
  return (
    <Box style={{ flex: "none" }}>
      <StyledAppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {children}
          </Typography>
          {accept && (
            <Button
              sx={{ mr: -1.5 }}
              autoFocus
              color="inherit"
              onClick={accept.onClick}
              disabled={accept.disabled}
              aria-label={accept["aria-label"]}
            >
              {accept.text}
            </Button>
          )}
        </Toolbar>
      </StyledAppBar>
      {divider && <Divider />}
    </Box>
  );
};

export default FullScreenDialogTitle;
