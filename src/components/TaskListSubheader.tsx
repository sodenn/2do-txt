import { alpha, Chip, ListSubheader, styled } from "@mui/material";
import { useMemo } from "react";
import { useFilter } from "../data/FilterContext";

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  background: `linear-gradient(
    to top,
    ${alpha(theme.palette.background.default, 0)},
    ${theme.palette.background.default} 15%
  )`,
}));

interface TaskListSubheaderProps {
  title: string;
}

const TaskListSubheader = ({ title }: TaskListSubheaderProps) => {
  const { sortBy } = useFilter();
  return useMemo(
    () => (
      <StyledListSubheader
        sx={{
          // avoid scrollbar overlapping (Safari mobile)
          top: { xs: -1, lg: 0 },
          marginLeft: { xs: 2, lg: 0 },
          paddingLeft: { lg: 2 },
          marginRight: { xs: 2, lg: 0 },
          paddingRight: { lg: 2 },
        }}
      >
        <Chip
          sx={{ px: 1 }}
          size="small"
          label={title}
          variant="outlined"
          aria-label="Task group"
          color={sortBy === "dueDate" ? "warning" : "secondary"}
        />
      </StyledListSubheader>
    ),
    [title, sortBy]
  );
};

export default TaskListSubheader;
