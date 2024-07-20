import { useFilterStore } from "@/stores/filter-store";
import { ExternalLinkIcon } from "lucide-react";

interface TaskListHeaderProps {
  fileName: string;
  filePath: string;
}

export function TaskListHeader(props: TaskListHeaderProps) {
  const { fileName, filePath } = props;
  const setActiveTaskListPath = useFilterStore(
    (state) => state.setActiveTaskListPath,
  );
  return (
    <li
      className="flex cursor-pointer items-center overflow-hidden rounded p-3 hover:bg-muted/50"
      tabIndex={-1}
      onClick={() => setActiveTaskListPath(filePath)}
    >
      <h3 className="flex-1 truncate font-semibold leading-none tracking-tight">
        {fileName}
      </h3>
      <ExternalLinkIcon className="h-4 w-4" />
    </li>
  );
}
