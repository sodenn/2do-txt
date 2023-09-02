import { useFilterStore } from "@/stores/filter-store";
import { alpha, Chip, ListSubheader, styled } from "@mui/material";
import { useMemo } from "react";

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

export function TaskListSubheader({ title }: TaskListSubheaderProps) {
  const sortBy = useFilterStore((state) => state.sortBy);
  return useMemo(
    () => (
      <StyledListSubheader
        sx={{
          // avoid scrollbar overlapping (Safari mobile)
          top: { xs: -1, lg: 0 },
          marginLeft: { xs: 2, lg: 0 },
          paddingLeft: { xs: 0, lg: 2 },
          marginRight: { xs: 2, lg: 0 },
          paddingRight: { xs: 0, lg: 2 },
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
    [title, sortBy],
  );
}
