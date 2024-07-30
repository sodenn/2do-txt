import { useFilterStore } from "@/stores/filter-store";
import { ExternalLinkIcon } from "lucide-react";

interface TaskListHeaderProps {
  id: string;
  filename: string;
}

export function TaskListHeader(props: TaskListHeaderProps) {
  const { id, filename } = props;
  const setActiveTaskListId = useFilterStore(
    (state) => state.setActiveTaskListId,
  );
  return (
    <li
      className="mb-2 flex cursor-pointer items-center overflow-hidden rounded p-3 hover:bg-muted/50"
      tabIndex={-1}
      onClick={() => setActiveTaskListId(id)}
    >
      <h3 className="flex-1 truncate font-semibold leading-none tracking-tight">
        {filename}
      </h3>
      <ExternalLinkIcon className="h-4 w-4" />
    </li>
  );
}
