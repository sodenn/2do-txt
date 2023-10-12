import { StartEllipsis } from "@/components/StartEllipsis";
import { useFilterStore } from "@/stores/filter-store";
import LaunchIcon from "@mui/icons-material/Launch";
import { Box, ListItemButton, styled } from "@mui/joy";

interface TaskListHeaderProps {
  fileName: string;
  filePath: string;
}

const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flex: 1,
  alignItems: "center",
  justifyContent: "space-between",
  overflow: "hidden",
  gap: theme.spacing(2),
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  [theme.breakpoints.up("lg")]: {
    borderRadius: theme.radius.sm,
  },
  "@media (pointer: coarse)": {
    '&:not(.Mui-selected, [aria-selected="true"]):active': {
      backgroundColor: "inherit",
    },
    ':not(.Mui-selected, [aria-selected="true"]):hover': {
      backgroundColor: "inherit",
    },
  },
}));

export function TaskListHeader(props: TaskListHeaderProps) {
  const { fileName, filePath } = props;
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  return (
    <StyledListItemButton
      tabIndex={-1}
      onClick={() => setActiveTaskListPath(filePath)}
    >
      <Container>
        <StartEllipsis level="title-lg">{fileName}</StartEllipsis>
        <LaunchIcon />
      </Container>
    </StyledListItemButton>
  );
}
