import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";
import { useFullScreenDialog } from "./FullScreenDialogProvider";

interface FullScreenDialogTitleProps extends PropsWithChildren {
  onClose: () => void;
  accept?: {
    text?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    "aria-label"?: string;
  };
}

const StyledAppBar = styled(AppBar)({
  paddingTop: "env(safe-area-inset-top)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingRight: "env(safe-area-inset-right)",
});

const FullScreenDialogTitle = (props: FullScreenDialogTitleProps) => {
  const { onClose, accept, children } = props;
  const { divider } = useFullScreenDialog();
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
            <LoadingButton
              sx={{ mr: -1.5 }}
              color="inherit"
              onClick={accept.onClick}
              loading={accept.loading}
              disabled={accept.disabled}
              aria-label={accept["aria-label"]}
            >
              {accept.text}
            </LoadingButton>
          )}
        </Toolbar>
      </StyledAppBar>
      {divider && <Divider />}
    </Box>
  );
};

export default FullScreenDialogTitle;
