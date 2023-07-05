import {
  Box,
  BoxProps,
  PaletteMode,
  styled,
  SxProps,
  Theme,
  useTheme,
} from "@mui/material";

interface TagBoxProps extends BoxProps {
  chip: boolean;
  completed: boolean;
  type?: "context" | "project" | "tag";
  tagKey?: string;
}

const SpanBox = (props: BoxProps) => <Box {...props} component="span" />;

const TextBox = styled(SpanBox)({
  hyphens: "none",
  wordBreak: "break-word",
  textDecoration: "inherit",
});

const ChipBox = styled(SpanBox)(() => ({
  hyphens: "none",
  display: "inline",
  marginTop: "2px",
  marginBottom: "2px",
  padding: "1px 0",
  borderRadius: "4px",
  wordBreak: "break-word",
  textDecoration: "inherit",
  "&:before, &:after": {
    content: '"\\00a0"',
  },
}));

const contextStyle = (chip: boolean, completed: boolean): SxProps<Theme> => ({
  color: completed ? undefined : chip ? "success.contrastText" : "success.main",
  bgcolor: !completed && chip ? "success.light" : undefined,
});

const projectStyle = (chip: boolean, completed: boolean): SxProps<Theme> => ({
  color: completed ? undefined : chip ? "info.contrastText" : "info.main",
  bgcolor: !completed && chip ? "info.light" : undefined,
});

const tagStyle = (
  chip: boolean,
  completed: boolean,
  mode: PaletteMode,
  tagKey: string,
): SxProps<Theme> => ({
  whiteSpace: "nowrap",
  color: chip
    ? completed
      ? undefined
      : tagKey === "due"
      ? "warning.contrastText"
      : tagKey === "pri"
      ? "secondary.contrastText"
      : mode === "dark"
      ? "grey.900"
      : "grey.100"
    : tagKey === "due"
    ? "text.warning"
    : tagKey === "pri"
    ? "text.secondary"
    : mode === "dark"
    ? "grey.500"
    : "grey.600",
  bgcolor:
    !chip || completed
      ? undefined
      : tagKey === "due"
      ? "warning.light"
      : tagKey === "pri"
      ? "secondary.light"
      : mode === "dark"
      ? "grey.400"
      : "grey.600",
});

const getStyle = (props: TagBoxProps, mode: PaletteMode) => {
  if (props.type === "context") {
    return contextStyle(props.chip, props.completed);
  }
  if (props.type === "project") {
    return projectStyle(props.chip, props.completed);
  }
  if (props.type === "tag" && props.tagKey) {
    return tagStyle(props.chip, props.completed, mode, props.tagKey);
  }
};

const TagBox = (props: TagBoxProps) => {
  const { chip, tagKey, completed, ...rest } = props;
  const {
    palette: { mode },
  } = useTheme();
  const sx = getStyle(props, mode) ?? rest.sx;
  if (chip) {
    return <ChipBox {...rest} sx={sx} />;
  }
  return <TextBox {...rest} sx={sx} />;
};

export default TagBox;
