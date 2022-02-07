import { alpha, Chip, ListSubheader, styled } from "@mui/material";
import React, { useMemo } from "react";
import { useFilter } from "../data/FilterContext";

const StyledListSubheader = styled(ListSubheader)`
  // avoid scrollbar overlapping (Safari mobile)
  top: -1px;
  margin-right: ${({ theme }) => theme.spacing(1)};
  background: linear-gradient(
    to top,
    ${({ theme }) => alpha(theme.palette.background.default, 0)},
    ${({ theme }) => theme.palette.background.default} 15%
  );
`;

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
          color={sortBy === "dueDate" ? "warning" : "secondary"}
        />
      </StyledListSubheader>
    ),
    [title, sortBy]
  );
};

export default TaskListSubheader;
