import { Chip, ListSubheader, styled } from "@mui/material";
import { useMemo } from "react";
import { useFilter } from "../data/FilterContext";

const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  // avoid scrollbar overlapping (Safari mobile)
  top: -1,
  marginRight: theme.spacing(1),
  background: `linear-gradient(
    to top,
    alpha(${theme.palette.background.default}, 0),
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
      <StyledListSubheader>
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
