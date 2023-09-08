import { BoxProps, Typography, TypographyProps } from "@mui/joy";

interface TagBoxProps extends BoxProps {
  outlined: boolean;
  completed: boolean;
  type?: "context" | "project" | "tag";
  tagKey?: string;
}

function getColor(props: TagBoxProps) {
  const { completed, type, tagKey } = props;
  if (completed) {
    return "completed";
  }
  if (type === "context") {
    return "success";
  }
  if (type === "project") {
    return "primary";
  }
  if (type === "tag") {
    if (tagKey === "due") {
      return "warning";
    }
    if (tagKey === "pri") {
      return "priority";
    }
  }
  return "neutral";
}

function Tag({
  completed,
  ...other
}: TypographyProps & { completed: boolean }) {
  return (
    <Typography
      component="span"
      sx={{
        display: "inline",
        borderRadius: "sm",
        ...(completed && { p: 0 }),
        ...other.sx,
      }}
      {...other}
    />
  );
}

export function TagBox(props: TagBoxProps) {
  const { outlined, completed, children } = props;
  const color = getColor(props);
  return (
    <Tag
      variant={!outlined || completed ? "plain" : "outlined"}
      color={color}
      completed={completed}
    >
      {children}
    </Tag>
  );
}
