import LaunchIcon from "@mui/icons-material/Launch";
import { Box, ListItemButton, styled, Typography } from "@mui/material";
import React from "react";
import { useFilter } from "../data/FilterContext";

interface TaskListHeaderProps {
  fileName: string;
  filePath: string;
}

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
}));

const Container = styled(Box)`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
`;

const TaskListHeader = (props: TaskListHeaderProps) => {
  const { fileName, filePath } = props;
  const { setActiveTaskListPath } = useFilter();
  return (
    <StyledListItemButton
      tabIndex={-1}
      onClick={() => setActiveTaskListPath(filePath)}
    >
      <Container>
        <Typography
          noWrap
          sx={{
            direction: "rtl",
            textAlign: "left",
          }}
          variant="h5"
        >
          {fileName}
        </Typography>
        <LaunchIcon />
      </Container>
    </StyledListItemButton>
  );
};

export default TaskListHeader;
