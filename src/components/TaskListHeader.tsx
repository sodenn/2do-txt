import LaunchIcon from "@mui/icons-material/Launch";
import { Box, ListItemButton, styled } from "@mui/material";
import { useFilter } from "../data/FilterContext";
import StartEllipsis from "./StartEllipsis";

interface TaskListHeaderProps {
  fileName: string;
  filePath: string;
}

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
}));

const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flex: 1,
  alignItems: "center",
  justifyContent: "space-between",
  overflow: "hidden",
  gap: theme.spacing(2),
}));

const TaskListHeader = (props: TaskListHeaderProps) => {
  const { fileName, filePath } = props;
  const { setActiveTaskListPath } = useFilter();
  return (
    <StyledListItemButton
      tabIndex={-1}
      onClick={() => setActiveTaskListPath(filePath)}
    >
      <Container>
        <StartEllipsis variant="h5">{fileName}</StartEllipsis>
        <LaunchIcon />
      </Container>
    </StyledListItemButton>
  );
};

export default TaskListHeader;
