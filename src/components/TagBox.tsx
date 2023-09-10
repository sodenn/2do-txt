import { Typography, TypographyProps } from "@mui/joy";

interface TagBoxProps extends TypographyProps {
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

export function TagBox(props: TagBoxProps) {
  const { outlined, completed, tagKey, type, ...other } = props;
  const color = getColor(props);
  return (
    <Typography
      component="span"
      variant={!outlined || completed ? "plain" : "outlined"}
      color={color}
      sx={{
        display: "inline",
        borderRadius: "sm",
        whiteSpace: "nowrap",
        py: 0, // prevent overlapping of tags in case of multiline text
        ...(completed && { p: 0 }), // prevent the interruption of strikethrough text
        ...other.sx,
      }}
      {...other}
    />
  );
}
