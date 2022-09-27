import { Box, BoxProps, styled } from "@mui/material";
import TagBox from "./TagBox";

interface PriorityBoxProps extends BoxProps {
  completed: boolean;
  chip: boolean;
}

const SpanBox = (props: BoxProps) => <Box {...props} component="span" />;

const PriorityBoxContent = styled(SpanBox)<{ completed: number }>(
  ({ theme, completed }) => ({
    boxShadow: `0 0 0 1pt ${
      !completed ? theme.palette.secondary.main : "inherit"
    }`,
    borderRadius: theme.spacing(1),
    color: !completed ? theme.palette.secondary.main : "inherit",
    "&:before, &:after": {
      content: '"\\00a0\\00a0"',
    },
  })
);

const PriorityBoxRoot = styled(SpanBox)(() => ({
  "&:after": {
    content: '"\\00a0"',
  },
}));

const PriorityBox = ({
  children,
  chip,
  completed,
  ...rest
}: PriorityBoxProps) => {
  if (chip) {
    return (
      <TagBox
        chip={true}
        sx={{
          fontWeight: "bold",
          color: completed ? undefined : "secondary.contrastText",
          bgcolor: completed ? undefined : "secondary.main",
        }}
      >
        {children}
      </TagBox>
    );
  }
  return (
    <PriorityBoxRoot>
      <PriorityBoxContent completed={completed ? 1 : 0} {...rest}>
        {children}
      </PriorityBoxContent>
    </PriorityBoxRoot>
  );
};

export default PriorityBox;
