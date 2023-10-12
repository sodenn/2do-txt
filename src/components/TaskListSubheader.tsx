import { useFilterStore } from "@/stores/filter-store";
import { Chip, ListSubheader } from "@mui/joy";

interface TaskListSubheaderProps {
  title: string;
}

export function TaskListSubheader({ title }: TaskListSubheaderProps) {
  const sortBy = useFilterStore((state) => state.sortBy);
  return (
    <ListSubheader
      sticky
      sx={{
        px: 1,
        zIndex: 2, // prevent subheader from being covered by the task checkbox
      }}
    >
      <Chip
        sx={{ px: 1 }}
        size="sm"
        variant="outlined"
        aria-label="Task group"
        color={sortBy === "dueDate" ? "warning" : "primary"}
      >
        {title}
      </Chip>
    </ListSubheader>
  );
}
