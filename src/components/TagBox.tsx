import { Box, BoxProps, styled } from "@mui/material";

interface TagBoxProps extends BoxProps {
  chip: boolean;
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

const TagBox = ({ chip, ...props }: TagBoxProps) => {
  if (chip) {
    return <ChipBox {...props} />;
  }
  return <TextBox {...props} />;
};

export default TagBox;
