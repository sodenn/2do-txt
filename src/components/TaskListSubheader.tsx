import { Chip } from "@/components/ui/chip";
import { useFilterStore } from "@/stores/filter-store";

interface TaskListSubheaderProps {
  title: string;
}

export function TaskListSubheader({ title }: TaskListSubheaderProps) {
  const sortBy = useFilterStore((state) => state.sortBy);
  return (
    // prevent subheader from being covered by the task checkbox (TODO check if needed)
    <div className="sticky top-0 z-10">
      <Chip
        variant="outline"
        size="sm"
        aria-label="Task group"
        color={sortBy === "dueDate" ? "warning" : "primary"}
      >
        {title}
      </Chip>
    </div>
  );
}
