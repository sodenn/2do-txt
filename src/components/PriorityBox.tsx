import { Typography } from "@mui/joy";
import { PropsWithChildren } from "react";

interface PriorityBoxProps {
  completed: boolean;
  outlined: boolean;
}

export function PriorityBox({
  children,
  outlined,
  completed,
}: PropsWithChildren<PriorityBoxProps>) {
  return (
    <Typography
      variant={completed ? "plain" : outlined ? "outlined" : "solid"}
      color={completed ? "completed" : "priority"}
      component="span"
      sx={{
        fontWeight: "bold",
        display: "inline",
        borderRadius: "sm",
        py: 0, // prevent overlapping of tags in case of multiline text
        ...(completed && {
          p: 0,
        }),
      }}
    >
      {children}
    </Typography>
  );
}
