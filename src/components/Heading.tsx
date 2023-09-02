import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Stack, Tooltip, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

interface HeadingProps extends PropsWithChildren {
  disabled?: boolean;
  helperText?: ReactNode;
  gutterBottom?: boolean;
}

export function Heading({
  disabled,
  helperText,
  gutterBottom,
  children,
}: HeadingProps) {
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
        <Tooltip
          disableTouchListener={false}
          enterTouchDelay={0}
          leaveTouchDelay={2000}
          title={helperText}
        >
          <HelpOutlineIcon color={disabled ? "action" : undefined} />
        </Tooltip>
      )}
    </Stack>
  );
}
