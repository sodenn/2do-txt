import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Stack, Tooltip, Typography } from "@mui/material";
import { ReactNode } from "react";
import { WithChildren } from "../types/common";

interface HeadingProps extends WithChildren {
  disabled?: boolean;
  helperText?: ReactNode;
  gutterBottom?: boolean;
}

const Heading = ({
  disabled,
  helperText,
  gutterBottom,
  children,
}: HeadingProps) => {
  return (
    <Stack
      spacing={1}
      direction="row"
      alignItems="center"
      sx={{ mb: gutterBottom ? "0.35em" : undefined }}
    >
      <Typography
        component="div"
        variant="subtitle1"
        color={disabled ? "text.secondary" : undefined}
      >
        {children}
      </Typography>
      {helperText && (
        <Tooltip enterTouchDelay={0} leaveTouchDelay={2000} title={helperText}>
          <HelpOutlineIcon color={disabled ? "action" : undefined} />
        </Tooltip>
      )}
    </Stack>
  );
};

export default Heading;
