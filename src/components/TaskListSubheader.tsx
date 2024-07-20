import { Chip } from "@/components/ui/chip";
import { useFilterStore } from "@/stores/filter-store";

interface TaskListSubheaderProps {
  title: string;
}

export function TaskListSubheader({ title }: TaskListSubheaderProps) {
  const sortBy = useFilterStore((state) => state.sortBy);
  return (
    <div className="sticky top-2 z-10 my-2 px-2">
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
